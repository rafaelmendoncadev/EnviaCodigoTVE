import { Router } from 'express';
import { WebhookController } from '../controllers/webhookController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Webhook endpoint - NO authentication required (Meta will call this)
router.all('/whatsapp', WebhookController.handleWhatsAppWebhook);

// Management routes - authentication required
router.get('/config', authenticateToken, WebhookController.getWebhookConfig);
router.post('/test', authenticateToken, WebhookController.testWebhookConnectivity);
router.post('/generate-token', authenticateToken, WebhookController.generateWebhookToken);
router.get('/status', authenticateToken, WebhookController.getWebhookStatus);

export default router;