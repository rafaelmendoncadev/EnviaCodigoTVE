import { Router } from 'express';
import { ArchiveController } from '../controllers/archiveController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

/**
 * @route POST /api/archive/codes
 * @desc Arquivar códigos selecionados
 * @access Private
 * @body {
 *   codeIds: string[],
 *   reason?: string
 * }
 */
router.post('/codes', ArchiveController.archiveCodes);

/**
 * @route POST /api/archive/session/:sessionId
 * @desc Arquivar sessão completa
 * @access Private
 * @body {
 *   reason?: string
 * }
 */
router.post('/session/:sessionId', ArchiveController.archiveSession);

/**
 * @route GET /api/archive/codes
 * @desc Obter códigos arquivados
 * @access Private
 * @query {
 *   page?: number,
 *   limit?: number
 * }
 */
router.get('/codes', ArchiveController.getArchivedCodes);

/**
 * @route GET /api/archive/history
 * @desc Obter histórico de arquivamento
 * @access Private
 * @query {
 *   page?: number,
 *   limit?: number
 * }
 */
router.get('/history', ArchiveController.getArchiveHistory);

/**
 * @route GET /api/archive/stats
 * @desc Obter estatísticas de arquivamento
 * @access Private
 */
router.get('/stats', ArchiveController.getArchiveStats);

/**
 * @route POST /api/archive/restore/:codeId
 * @desc Restaurar código arquivado
 * @access Private
 */
router.post('/restore/:codeId', ArchiveController.restoreCode);

/**
 * @route POST /api/archive/restore
 * @desc Restaurar múltiplos códigos arquivados
 * @access Private
 * @body {
 *   codeIds: string[]
 * }
 */
router.post('/restore', ArchiveController.restoreMultipleCodes);

export default router;