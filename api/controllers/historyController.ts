import { Request, Response } from 'express';
import { HistoryRepository } from '../repositories/historyRepository.js';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    uuid_id: string;
    email: string;
  };
}

export class HistoryController {
  
  /**
   * GET /api/history
   * Buscar histórico de envios e estatísticas
   */
  static async getHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.uuid_id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Usuário não autenticado'
        });
        return;
      }

      const { page = 1, limit = 50 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // Buscar histórico paginado
      const history = await HistoryRepository.findByUserId(
        userId,
        Number(limit),
        offset
      );

      // Buscar estatísticas
      const statistics = await HistoryRepository.getStatistics(userId);

      res.json({
        success: true,
        data: {
          history,
          statistics,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            offset
          }
        }
      });

    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /api/history/statistics
   * Buscar estatísticas detalhadas do usuário
   */
  static async getStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.uuid_id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Usuário não autenticado'
        });
        return;
      }

      const statistics = await HistoryRepository.getStatistics(userId);

      res.json({
        success: true,
        data: statistics
      });

    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Registrar ação no histórico (método utilitário)
   */
  static async recordAction(
    userId: string,
    codeId: string | null,
    actionType: 'send_whatsapp' | 'send_email' | 'archive' | 'unarchive',
    destination: string | null,
    status: 'success' | 'failed' | 'pending' = 'success',
    details?: string
  ): Promise<void> {
    try {
      await HistoryRepository.create({
        user_id: userId,
        code_id: codeId,
        action_type: actionType,
        destination,
        status,
        details
      });
    } catch (error) {
      console.error('Erro ao registrar ação no histórico:', error);
      // Não lançar erro para não interromper o fluxo principal
    }
  }
}