import { Router } from 'express';
import { UploadController } from '../controllers/uploadController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * @route GET /api/codes/:session_id
 * @desc Buscar códigos de uma sessão específica (conforme especificação)
 * @access Private
 */
router.get('/:session_id',
  authenticateToken,
  UploadController.getCodesBySession
);

/**
 * @route POST /api/codes/archive
 * @desc Arquivar códigos específicos
 * @access Private
 */
router.post('/archive',
  authenticateToken,
  UploadController.archiveCodes
);

/**
 * @route POST /api/codes/unarchive  
 * @desc Desarquivar códigos específicos
 * @access Private
 */
router.post('/unarchive',
  authenticateToken,
  UploadController.unarchiveCodes
);

export default router;