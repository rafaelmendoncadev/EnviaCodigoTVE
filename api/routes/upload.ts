import { Router } from 'express';
import { UploadController } from '../controllers/uploadController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * @route POST /api/upload
 * @desc Upload e processamento de arquivo Excel (rota unificada conforme especificação)
 * @access Private
 */
router.post('/', 
  authenticateToken,
  UploadController.uploadMiddleware,
  UploadController.uploadExcel
);

/**
 * @route GET /api/upload/sessions
 * @desc Listar sessões de upload do usuário
 * @access Private
 */
router.get('/sessions',
  authenticateToken,
  UploadController.getUserSessions
);

/**
 * @route GET /api/upload/sessions/:sessionId
 * @desc Buscar detalhes de uma sessão específica
 * @access Private
 */
router.get('/sessions/:sessionId',
  authenticateToken,
  UploadController.getSessionDetails
);

/**
 * @route GET /api/upload/sessions/:sessionId/codes
 * @desc Buscar códigos de uma sessão específica
 * @access Private
 */
router.get('/sessions/:sessionId/codes',
  authenticateToken,
  UploadController.getSessionCodes
);

/**
 * @route PUT /api/upload/codes/status
 * @desc Atualizar status de códigos específicos
 * @access Private
 */
router.put('/codes/status',
  authenticateToken,
  UploadController.updateCodesStatus
);

export default router;