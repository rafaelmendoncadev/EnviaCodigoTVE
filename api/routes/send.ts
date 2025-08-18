import { Router } from 'express';
import { SendController } from '../controllers/sendController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Rotas de envio
router.post('/whatsapp', SendController.sendWhatsApp);
router.post('/email', SendController.sendEmail);

// Rotas de teste
router.post('/test/whatsapp', SendController.testWhatsApp);
router.post('/test/email', SendController.testEmail);
router.post('/test/send-email', SendController.sendTestEmail);

// Rotas de informações
router.get('/whatsapp/info', SendController.getWhatsAppInfo);

export default router;