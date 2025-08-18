import { Request, Response } from 'express';
import { UploadService } from '../services/uploadService.js';
import { AuthRequest } from '../middleware/auth.js';
import multer from 'multer';
import { UploadRepository } from '../repositories/uploadRepository.js';

// Configuração do multer para upload em memória
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo não suportado. Use apenas arquivos .xlsx ou .xls'));
    }
  }
});

export class UploadController {
  /**
   * Middleware do multer para upload de arquivo único
   */
  static uploadMiddleware = upload.single('file');

  /**
   * Upload e processamento de arquivo Excel
   */
  static async uploadExcel(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'Nenhum arquivo foi enviado'
        });
        return;
      }

      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
        return;
      }

      // Validar formato do arquivo
      UploadService.validateFileFormat(req.file);

      // Processar arquivo
      const result = await UploadService.processExcelFile(req.user.id, req.file);

      res.status(200).json({
        session: {
          id: result.session.id,
          filename: result.session.filename,
          ...result.summary
        },
        codes: result.codes // Retornar todos os códigos extraídos
      });
    } catch (error) {
      console.error('Erro no upload:', error);
      
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Erro interno do servidor'
        });
      }
    }
  }

  /**
   * Listar sessões de upload do usuário
   */
  static async getUserSessions(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await UploadService.getUserUploadSessions(req.user.id, page, limit);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Erro ao buscar sessões:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Buscar códigos de uma sessão específica
   */
  static async getSessionCodes(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
        return;
      }

      const { sessionId } = req.params;
      const status = req.query.status as 'available' | 'sent' | 'archived' | undefined;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          message: 'ID da sessão é obrigatório'
        });
        return;
      }

      const result = await UploadService.getSessionCodes(sessionId, req.user.id, status);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Erro ao buscar códigos:', error);
      
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Erro interno do servidor'
        });
      }
    }
  }

  /**
   * Buscar detalhes de uma sessão específica
   */
  static async getSessionDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
        return;
      }

      const { sessionId } = req.params;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          message: 'ID da sessão é obrigatório'
        });
        return;
      }

      // Buscar sessão
      const session = await UploadRepository.findUploadSessionById(sessionId);
      
      if (!session || session.user_id !== req.user.id) {
        res.status(404).json({
          success: false,
          message: 'Sessão não encontrada'
        });
        return;
      }

      // Buscar resumo dos códigos
      const summary = await UploadRepository.countCodesByStatus(sessionId);

      res.status(200).json({
        success: true,
        data: {
          session,
          summary
        }
      });
    } catch (error) {
      console.error('Erro ao buscar detalhes da sessão:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Atualizar status de códigos específicos
   */
  static async updateCodesStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
        return;
      }

      const { codeIds, status } = req.body;

      if (!codeIds || !Array.isArray(codeIds) || codeIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Lista de IDs de códigos é obrigatória'
        });
        return;
      }

      if (!['available', 'sent', 'archived'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Status inválido'
        });
        return;
      }

      // Verificar se os códigos pertencem ao usuário
      const codes = await UploadRepository.findCodesByIds(codeIds);
      
      if (codes.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Nenhum código encontrado'
        });
        return;
      }

      // Verificar propriedade através das sessões
      const sessionIds = [...new Set(codes.map(code => code.session_id))];
      const sessions = await Promise.all(
        sessionIds.map(id => UploadRepository.findUploadSessionById(id))
      );

      const userOwnsAllSessions = sessions.every(session => session?.user_id === req.user?.id);
      
      if (!userOwnsAllSessions) {
        res.status(403).json({
          success: false,
          message: 'Acesso negado aos códigos especificados'
        });
        return;
      }

      // Atualizar status
      await UploadRepository.updateCodesStatus(codeIds, status);

      res.status(200).json({
        success: true,
        message: `Status de ${codes.length} código(s) atualizado para '${status}'`
      });
    } catch (error) {
      console.error('Erro ao atualizar status dos códigos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /api/codes/:session_id
   * Buscar códigos por sessão (conforme especificação)
   */
  static async getCodesBySession(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.uuid_id) {
        res.status(401).json({
          success: false,
          error: 'Usuário não autenticado'
        });
        return;
      }

      const { session_id } = req.params;
      const { page = 1, limit = 50, status } = req.query;

      // Verificar se a sessão existe e pertence ao usuário
      const session = await UploadRepository.findUploadSessionById(session_id);
      if (!session || session.user_id !== req.user.uuid_id) {
        res.status(404).json({
          success: false,
          error: 'Sessão não encontrada'
        });
        return;
      }

      // Buscar códigos com paginação
      const offset = (Number(page) - 1) * Number(limit);
      let codes = await UploadRepository.findCodesBySession(
        session_id, 
        status as 'available' | 'sent' | 'archived'
      );

      // Aplicar paginação manualmente (simplificado)
      const totalCodes = codes.length;
      codes = codes.slice(offset, offset + Number(limit));

      res.json({
        success: true,
        data: {
          codes,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: totalCodes,
            totalPages: Math.ceil(totalCodes / Number(limit))
          }
        }
      });

    } catch (error) {
      console.error('Erro ao buscar códigos por sessão:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * POST /api/codes/archive
   * Arquivar códigos específicos
   */
  static async archiveCodes(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.uuid_id) {
        res.status(401).json({
          success: false,
          error: 'Usuário não autenticado'
        });
        return;
      }

      const { code_ids } = req.body;

      if (!Array.isArray(code_ids) || code_ids.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Lista de IDs de códigos é obrigatória'
        });
        return;
      }

      // Verificar propriedade dos códigos
      const codes = await UploadRepository.findCodesByIds(code_ids);
      const sessions = await Promise.all(
        codes.map(code => UploadRepository.findUploadSessionById(code.session_id))
      );

      const userOwnsAllCodes = sessions.every(session => session?.user_id === req.user?.uuid_id);
      if (!userOwnsAllCodes) {
        res.status(403).json({
          success: false,
          error: 'Acesso negado aos códigos especificados'
        });
        return;
      }

      // Arquivar códigos
      await UploadRepository.updateCodesStatus(code_ids, 'archived');

      res.json({
        success: true,
        message: `${code_ids.length} código(s) arquivado(s) com sucesso`
      });

    } catch (error) {
      console.error('Erro ao arquivar códigos:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * POST /api/codes/unarchive
   * Desarquivar códigos específicos
   */
  static async unarchiveCodes(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.uuid_id) {
        res.status(401).json({
          success: false,
          error: 'Usuário não autenticado'
        });
        return;
      }

      const { code_ids } = req.body;

      if (!Array.isArray(code_ids) || code_ids.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Lista de IDs de códigos é obrigatória'
        });
        return;
      }

      // Verificar propriedade dos códigos
      const codes = await UploadRepository.findCodesByIds(code_ids);
      const sessions = await Promise.all(
        codes.map(code => UploadRepository.findUploadSessionById(code.session_id))
      );

      const userOwnsAllCodes = sessions.every(session => session?.user_id === req.user?.uuid_id);
      if (!userOwnsAllCodes) {
        res.status(403).json({
          success: false,
          error: 'Acesso negado aos códigos especificados'
        });
        return;
      }

      // Desarquivar códigos (voltar para disponível)
      await UploadRepository.updateCodesStatus(code_ids, 'available');

      res.json({
        success: true,
        message: `${code_ids.length} código(s) desarquivado(s) com sucesso`
      });

    } catch (error) {
      console.error('Erro ao desarquivar códigos:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}