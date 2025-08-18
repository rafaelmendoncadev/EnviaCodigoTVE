import { Router } from 'express';
import { HistoryController } from '../controllers/historyController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * @route GET /api/history
 * @desc Buscar histórico de envios e estatísticas (conforme especificação)
 * @access Private
 */
router.get('/',
  authenticateToken,
  HistoryController.getHistory
);

/**
 * @route GET /api/history/statistics
 * @desc Buscar estatísticas detalhadas do usuário
 * @access Private
 */
router.get('/statistics',
  authenticateToken,
  HistoryController.getStatistics
);

export default router;