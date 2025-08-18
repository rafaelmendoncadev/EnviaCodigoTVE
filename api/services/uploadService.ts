import * as XLSX from 'xlsx';
import { UploadRepository } from '../repositories/uploadRepository.js';
import { UploadSession, Code } from '../models/types.js';
import path from 'path';
import fs from 'fs/promises';

export class UploadService {
  /**
   * Processar arquivo Excel e extrair códigos
   */
  static async processExcelFile(
    userId: string,
    file: Express.Multer.File
  ): Promise<{
    session: UploadSession;
    codes: Code[];
    summary: {
      totalCodes: number;
      validCodes: number;
      invalidCodes: number;
    };
  }> {
    try {
      // Criar sessão de upload
      const session = await UploadRepository.createUploadSession(
        userId,
        file.filename || `upload_${Date.now()}.xlsx`,
        file.originalname,
        file.size
      );

      // Processar arquivo Excel
      const extractedData = await this.extractDataFromExcel(file.buffer);
      
      // Validar e limpar dados
      const validatedCodes = this.validateAndCleanCodes(extractedData);
      
      // Inserir códigos no banco
      const codes = await UploadRepository.insertCodes(session.id, validatedCodes.valid);
      
      // Atualizar status da sessão
      await UploadRepository.updateUploadSessionStatus(session.id, 'completed');
      
      return {
        session,
        codes,
        summary: {
          totalCodes: extractedData.length,
          validCodes: validatedCodes.valid.length,
          invalidCodes: validatedCodes.invalid.length
        }
      };
    } catch (error) {
      console.error('Erro ao processar arquivo Excel:', error);
      throw new Error('Falha ao processar arquivo Excel');
    }
  }

  /**
   * Extrair dados do arquivo Excel (colunas A e D, a partir da linha 3)
   */
  private static async extractDataFromExcel(buffer: Buffer): Promise<Array<{code: string, description: string}>> {
    try {
      // Ler arquivo Excel
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      // Pegar a primeira planilha
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('Nenhuma planilha encontrada no arquivo');
      }
      
      const worksheet = workbook.Sheets[sheetName];
      
      // Converter para JSON com header específico
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1, // Usar índices numéricos
        range: 2 // Começar da linha 3 (índice 2)
      }) as any[][];
      
      const extractedData: Array<{code: string, description: string}> = [];
      
      // Processar cada linha
      jsonData.forEach((row, index) => {
        if (row && row.length > 0) {
          const code = row[0] ? String(row[0]).trim() : ''; // Coluna A
          const description = row[3] ? String(row[3]).trim() : ''; // Coluna D
          
          // Adicionar apenas se pelo menos o código existir
          if (code) {
            extractedData.push({
              code,
              description: description || `Código ${code}`
            });
          }
        }
      });
      
      return extractedData;
    } catch (error) {
      console.error('Erro ao extrair dados do Excel:', error);
      throw new Error('Formato de arquivo Excel inválido');
    }
  }

  /**
   * Validar e limpar códigos extraídos
   */
  private static validateAndCleanCodes(codes: Array<{code: string, description: string}>): {
    valid: Array<{code: string, description: string}>;
    invalid: Array<{code: string, description: string, reason: string}>;
  } {
    const valid: Array<{code: string, description: string}> = [];
    const invalid: Array<{code: string, description: string, reason: string}> = [];
    const seenCodes = new Set<string>();
    
    codes.forEach(item => {
      const { code, description } = item;
      
      // Verificar se código não está vazio
      if (!code || code.length === 0) {
        invalid.push({ ...item, reason: 'Código vazio' });
        return;
      }
      
      // Verificar se código não é muito longo
      if (code.length > 100) {
        invalid.push({ ...item, reason: 'Código muito longo (máx. 100 caracteres)' });
        return;
      }
      
      // Verificar se descrição não é muito longa
      if (description.length > 255) {
        invalid.push({ ...item, reason: 'Descrição muito longa (máx. 255 caracteres)' });
        return;
      }
      
      // Verificar duplicatas
      if (seenCodes.has(code)) {
        invalid.push({ ...item, reason: 'Código duplicado' });
        return;
      }
      
      // Código válido
      seenCodes.add(code);
      valid.push({ code, description });
    });
    
    return { valid, invalid };
  }

  /**
   * Buscar sessões de upload do usuário
   */
  static async getUserUploadSessions(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    sessions: UploadSession[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    const sessions = await UploadRepository.findUploadSessionsByUser(userId, limit, offset);
    
    // Para simplicidade, vamos assumir que temos todas as sessões
    // Em produção, você faria uma query separada para contar o total
    const total = sessions.length;
    const totalPages = Math.ceil(total / limit);
    
    return {
      sessions,
      total,
      page,
      totalPages
    };
  }

  /**
   * Buscar códigos de uma sessão específica
   */
  static async getSessionCodes(
    sessionId: string,
    userId: string,
    status?: 'available' | 'sent' | 'archived'
  ): Promise<{
    codes: Code[];
    summary: {
      available: number;
      sent: number;
      archived: number;
      total: number;
    };
  }> {
    // Verificar se a sessão pertence ao usuário
    const session = await UploadRepository.findUploadSessionById(sessionId);
    if (!session || session.user_id !== userId) {
      throw new Error('Sessão não encontrada ou acesso negado');
    }
    
    // Buscar códigos
    const codes = await UploadRepository.findCodesBySession(sessionId, status);
    
    // Buscar resumo
    const summary = await UploadRepository.countCodesByStatus(sessionId);
    
    return {
      codes,
      summary
    };
  }

  /**
   * Validar formato de arquivo
   */
  static validateFileFormat(file: Express.Multer.File): void {
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];
    
    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (!allowedMimeTypes.includes(file.mimetype) || !allowedExtensions.includes(fileExtension)) {
      throw new Error('Formato de arquivo não suportado. Use apenas arquivos .xlsx ou .xls');
    }
    
    // Verificar tamanho do arquivo (10MB máximo)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('Arquivo muito grande. Tamanho máximo: 10MB');
    }
  }
}