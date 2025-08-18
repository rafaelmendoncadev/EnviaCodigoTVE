import { Router } from 'express';
import { SettingsController } from '../controllers/settingsControllerNew.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Rotas para configurações WhatsApp
router.post('/whatsapp', SettingsController.saveWhatsAppConfig);
router.get('/whatsapp', SettingsController.getWhatsAppConfig);

// Rotas de teste de conectividade (conforme especificação)
router.post('/test/whatsapp', SettingsController.testWhatsAppConnection);
router.post('/test/email', SettingsController.testEmailConnection);

export default router;