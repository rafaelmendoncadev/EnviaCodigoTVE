import { UploadRepository } from '../repositories/uploadRepository.js';
import { Code, HistoryItem } from '../models/types.js';
import pool from '../config/database.js';

export class ArchiveService {
  /**
   * Arquivar códigos enviados automaticamente
   */
  static async archiveSentCodes(
    userId: string,
    codeIds: string[],
    archiveReason: string = 'Enviado com sucesso'
  ): Promise<{
    success: boolean;
    archivedCount: number;
    errors: string[];
  }> {
    try {
      const errors: string[] = [];
      let archivedCount = 0;

      for (const codeId of codeIds) {
        try {
          // Verificar se o código existe e pertence ao usuário
          const code = await UploadRepository.findCodeById(codeId);
          if (!code) {
            errors.push(`Código ${codeId} não encontrado`);
            continue;
          }

          // Verificar se o código pertence ao usuário
          const session = await UploadRepository.findSessionById(code.session_id);
      if (!session || session.user_id !== userId) {
            errors.push(`Acesso negado ao código ${codeId}`);
            continue;
          }

          // Verificar se o código foi enviado
          if (code.status !== 'sent') {
            errors.push(`Código ${code.combined_code} não foi enviado (status: ${code.status})`);
            continue;
          }

          // Arquivar código
          await this.archiveCode(code, archiveReason);
          archivedCount++;
        } catch (error) {
          console.error(`Erro ao arquivar código ${codeId}:`, error);
          errors.push(`Erro ao arquivar código ${codeId}`);
        }
      }

      return {
        success: errors.length === 0,
        archivedCount,
        errors
      };
    } catch (error) {
      console.error('Erro no serviço de arquivamento:', error);
      return {
        success: false,
        archivedCount: 0,
        errors: [error instanceof Error ? error.message : 'Erro interno do servidor']
      };
    }
  }

  /**
   * Arquivar código individual
   */
  private static async archiveCode(
    code: Code,
    reason: string
  ): Promise<void> {
    try {
      // Atualizar status do código para 'archived'
      await pool.query(
        'UPDATE codes SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['archived', code.id]
      );

      // Criar entrada no histórico
      await pool.query(
        `INSERT INTO history_items (
          id, user_id, session_id, code_id, action, details, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [
          crypto.randomUUID(),
          (await this.getSessionUserId(code.session_id)),
          code.session_id,
          code.id,
          'archived',
          JSON.stringify({
            reason,
            code: code.combined_code,
            description: code.column_a_value || code.combined_code,
            archivedAt: new Date().toISOString()
          })
        ]
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obter ID do usuário da sessão
   */
  private static async getSessionUserId(sessionId: string): Promise<string> {
    const session = await UploadRepository.findSessionById(sessionId);
    if (!session) {
      throw new Error('Sessão não encontrada');
    }
    return session.user_id;
  }

  /**
   * Arquivar sessão completa
   */
  static async archiveSession(
    userId: string,
    sessionId: string,
    reason: string = 'Sessão arquivada manualmente'
  ): Promise<{
    success: boolean;
    archivedCount: number;
    errors: string[];
  }> {
    try {
      // Verificar se a sessão pertence ao usuário
      const session = await UploadRepository.findSessionById(sessionId);
      if (!session || session.user_id !== userId) {
        return {
          success: false,
          archivedCount: 0,
          errors: ['Sessão não encontrada ou acesso negado']
        };
      }

      // Buscar todos os códigos da sessão que estão enviados
      const codes = await UploadRepository.findCodesBySession(sessionId, 'sent');
      
      if (codes.length === 0) {
        return {
          success: true,
          archivedCount: 0,
          errors: ['Nenhum código enviado encontrado para arquivar']
        };
      }

      // Arquivar todos os códigos enviados
      const codeIds = codes.map(code => code.id);
      return await this.archiveSentCodes(userId, codeIds, reason);
    } catch (error) {
      console.error('Erro ao arquivar sessão:', error);
      return {
        success: false,
        archivedCount: 0,
        errors: [error instanceof Error ? error.message : 'Erro interno do servidor']
      };
    }
  }

  /**
   * Obter códigos arquivados do usuário
   */
  static async getArchivedCodes(
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    codes: Code[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const offset = (page - 1) * limit;

      // Buscar códigos arquivados
      const codesResult = await pool.query(
        `SELECT c.*, s.filename, s.created_at as session_created_at
         FROM codes c
         JOIN upload_sessions s ON c.session_id = s.id
         WHERE s.user_id = $1 AND c.status = 'archived'
         ORDER BY c.updated_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      // Contar total
      const countResult = await pool.query(
        `SELECT COUNT(*) as total
         FROM codes c
         JOIN upload_sessions s ON c.session_id = s.id
         WHERE s.user_id = $1 AND c.status = 'archived'`,
        [userId]
      );

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        codes: codesResult.rows,
        total,
        page,
        totalPages
      };
    } catch (error) {
      console.error('Erro ao buscar códigos arquivados:', error);
      throw new Error('Erro ao buscar códigos arquivados');
    }
  }

  /**
   * Obter histórico de arquivamento
   */
  static async getArchiveHistory(
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    history: HistoryItem[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const offset = (page - 1) * limit;

      // Buscar histórico de arquivamento
      const historyResult = await pool.query(
        `SELECT h.*, c.code, c.description, s.filename
         FROM history_items h
         LEFT JOIN codes c ON h.code_id = c.id
         LEFT JOIN upload_sessions s ON h.session_id = s.id
         WHERE h.user_id = $1 AND h.action = 'archived'
         ORDER BY h.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      // Contar total
      const countResult = await pool.query(
        `SELECT COUNT(*) as total
         FROM history_items
         WHERE user_id = $1 AND action = 'archived'`,
        [userId]
      );

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        history: historyResult.rows,
        total,
        page,
        totalPages
      };
    } catch (error) {
      console.error('Erro ao buscar histórico de arquivamento:', error);
      throw new Error('Erro ao buscar histórico de arquivamento');
    }
  }

  /**
   * Restaurar código arquivado
   */
  static async restoreCode(
    userId: string,
    codeId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Verificar se o código existe e pertence ao usuário
      const code = await UploadRepository.findCodeById(codeId);
      if (!code) {
        return {
          success: false,
          message: 'Código não encontrado'
        };
      }

      // Verificar se o código pertence ao usuário
      const session = await UploadRepository.findSessionById(code.session_id);
      if (!session || session.user_id !== userId) {
        return {
          success: false,
          message: 'Acesso negado'
        };
      }

      // Verificar se o código está arquivado
      if (code.status !== 'archived') {
        return {
          success: false,
          message: `Código não está arquivado (status: ${code.status})`
        };
      }

      try {
        // Restaurar código para status 'available'
        await pool.query(
          'UPDATE codes SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['available', codeId]
        );

        // Criar entrada no histórico
        await pool.query(
          `INSERT INTO history_items (
            id, user_id, session_id, code_id, action, details, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
          [
            crypto.randomUUID(),
            userId,
            code.session_id,
            codeId,
            'restored',
            JSON.stringify({
              reason: 'Código restaurado do arquivo',
              code: code.combined_code,
              description: code.column_a_value || code.combined_code,
              restoredAt: new Date().toISOString()
            })
          ]
        );

        return {
          success: true,
          message: 'Código restaurado com sucesso'
        };
      } catch (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erro ao restaurar código:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      };
    }
  }

  /**
   * Obter estatísticas de arquivamento
   */
  static async getArchiveStats(userId: string): Promise<{
    totalArchived: number;
    archivedToday: number;
    archivedThisWeek: number;
    archivedThisMonth: number;
  }> {
    try {
      const result = await pool.query(
        `SELECT 
          COUNT(*) as total_archived,
          COUNT(CASE WHEN DATE(c.updated_at) = CURRENT_DATE THEN 1 END) as archived_today,
          COUNT(CASE WHEN c.updated_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as archived_this_week,
          COUNT(CASE WHEN c.updated_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as archived_this_month
         FROM codes c
         JOIN upload_sessions s ON c.session_id = s.id
         WHERE s.user_id = $1 AND c.status = 'archived'`,
        [userId]
      );

      const stats = result.rows[0];
      
      return {
        totalArchived: parseInt(stats.total_archived) || 0,
        archivedToday: parseInt(stats.archived_today) || 0,
        archivedThisWeek: parseInt(stats.archived_this_week) || 0,
        archivedThisMonth: parseInt(stats.archived_this_month) || 0
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de arquivamento:', error);
      return {
        totalArchived: 0,
        archivedToday: 0,
        archivedThisWeek: 0,
        archivedThisMonth: 0
      };
    }
  }
}