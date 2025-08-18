import { Request, Response } from 'express';
import { ArchiveService } from '../services/archiveService.js';
import { AuthRequest } from '../middleware/auth.js';

export class ArchiveController {
  /**
   * Arquivar códigos selecionados
   */
  static async archiveCodes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { codeIds, reason } = req.body;
      const userId = req.user!.id;

      // Validar entrada
      if (!codeIds || !Array.isArray(codeIds) || codeIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Lista de códigos é obrigatória'
        });
        return;
      }

      if (codeIds.length > 100) {
        res.status(400).json({
          success: false,
          message: 'Máximo de 100 códigos por operação'
        });
        return;
      }

      // Validar que todos os IDs são strings válidas
      const invalidIds = codeIds.filter(id => typeof id !== 'string' || !id.trim());
      if (invalidIds.length > 0) {
        res.status(400).json({
          success: false,
          message: 'IDs de códigos inválidos'
        });
        return;
      }

      // Arquivar códigos
      const result = await ArchiveService.archiveSentCodes(
        userId,
        codeIds,
        reason || 'Arquivado manualmente'
      );

      if (result.success) {
        res.json({
          success: true,
          message: `${result.archivedCount} código(s) arquivado(s) com sucesso`,
          archivedCount: result.archivedCount,
          errors: result.errors
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Alguns códigos não puderam ser arquivados',
          archivedCount: result.archivedCount,
          errors: result.errors
        });
      }
    } catch (error) {
      console.error('Erro ao arquivar códigos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Arquivar sessão completa
   */
  static async archiveSession(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { reason } = req.body;
      const userId = req.user!.id;

      // Validar entrada
      if (!sessionId) {
        res.status(400).json({
          success: false,
          message: 'ID da sessão é obrigatório'
        });
        return;
      }

      // Arquivar sessão
      const result = await ArchiveService.archiveSession(
        userId,
        sessionId,
        reason || 'Sessão arquivada manualmente'
      );

      if (result.success) {
        res.json({
          success: true,
          message: `Sessão arquivada: ${result.archivedCount} código(s) arquivado(s)`,
          archivedCount: result.archivedCount,
          errors: result.errors
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Erro ao arquivar sessão',
          archivedCount: result.archivedCount,
          errors: result.errors
        });
      }
    } catch (error) {
      console.error('Erro ao arquivar sessão:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obter códigos arquivados
   */
  static async getArchivedCodes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

      // Validar parâmetros
      if (page < 1) {
        res.status(400).json({
          success: false,
          message: 'Página deve ser maior que 0'
        });
        return;
      }

      if (limit < 1) {
        res.status(400).json({
          success: false,
          message: 'Limite deve ser maior que 0'
        });
        return;
      }

      // Buscar códigos arquivados
      const result = await ArchiveService.getArchivedCodes(userId, page, limit);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Erro ao buscar códigos arquivados:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obter histórico de arquivamento
   */
  static async getArchiveHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

      // Validar parâmetros
      if (page < 1) {
        res.status(400).json({
          success: false,
          message: 'Página deve ser maior que 0'
        });
        return;
      }

      if (limit < 1) {
        res.status(400).json({
          success: false,
          message: 'Limite deve ser maior que 0'
        });
        return;
      }

      // Buscar histórico
      const result = await ArchiveService.getArchiveHistory(userId, page, limit);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Erro ao buscar histórico de arquivamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Restaurar código arquivado
   */
  static async restoreCode(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { codeId } = req.params;
      const userId = req.user!.id;

      // Validar entrada
      if (!codeId) {
        res.status(400).json({
          success: false,
          message: 'ID do código é obrigatório'
        });
        return;
      }

      // Restaurar código
      const result = await ArchiveService.restoreCode(userId, codeId);

      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Erro ao restaurar código:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obter estatísticas de arquivamento
   */
  static async getArchiveStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      // Buscar estatísticas
      const stats = await ArchiveService.getArchiveStats(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas de arquivamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Restaurar múltiplos códigos
   */
  static async restoreMultipleCodes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { codeIds } = req.body;
      const userId = req.user!.id;

      // Validar entrada
      if (!codeIds || !Array.isArray(codeIds) || codeIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Lista de códigos é obrigatória'
        });
        return;
      }

      if (codeIds.length > 50) {
        res.status(400).json({
          success: false,
          message: 'Máximo de 50 códigos por operação de restauração'
        });
        return;
      }

      // Validar que todos os IDs são strings válidas
      const invalidIds = codeIds.filter(id => typeof id !== 'string' || !id.trim());
      if (invalidIds.length > 0) {
        res.status(400).json({
          success: false,
          message: 'IDs de códigos inválidos'
        });
        return;
      }

      // Restaurar códigos
      const results = [];
      let successCount = 0;
      const errors = [];

      for (const codeId of codeIds) {
        try {
          const result = await ArchiveService.restoreCode(userId, codeId);
          results.push({ codeId, ...result });
          if (result.success) {
            successCount++;
          } else {
            errors.push(`${codeId}: ${result.message}`);
          }
        } catch (error) {
          errors.push(`${codeId}: Erro interno`);
        }
      }

      res.json({
        success: errors.length === 0,
        message: `${successCount} código(s) restaurado(s) de ${codeIds.length}`,
        restoredCount: successCount,
        totalRequested: codeIds.length,
        errors,
        results
      });
    } catch (error) {
      console.error('Erro ao restaurar múltiplos códigos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}