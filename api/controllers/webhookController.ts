import { Request, Response } from 'express';
import { WebhookService } from '../services/webhookService.js';
import { WhatsAppWebhookEvent } from '../models/types.js';
import { AuthRequest } from '../middleware/auth.js';

export class WebhookController {
  /**
   * Handle WhatsApp webhook verification and events
   */
  static async handleWhatsAppWebhook(req: Request, res: Response): Promise<void> {
    try {
      // Handle webhook verification (GET request)
      if (req.method === 'GET') {
        const mode = req.query['hub.mode'] as string;
        const token = req.query['hub.verify_token'] as string;
        const challenge = req.query['hub.challenge'] as string;

        // Get expected token from environment or configuration
        const expectedToken = process.env.WHATSAPP_WEBHOOK_TOKEN || 'default-webhook-token';

        const verificationResult = WebhookService.verifyWebhookToken(mode, token, challenge, expectedToken);

        if (verificationResult) {
          console.log('WhatsApp webhook verified successfully');
          res.status(200).send(verificationResult);
        } else {
          console.warn('WhatsApp webhook verification failed');
          res.status(403).send('Forbidden');
        }
        return;
      }

      // Handle webhook events (POST request)
      if (req.method === 'POST') {
        const signature = req.headers['x-hub-signature-256'] as string;
        const payload = JSON.stringify(req.body);

        // Verify signature if secret is configured
        const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET;
        if (webhookSecret && signature) {
          const isValidSignature = WebhookService.verifyWhatsAppSignature(payload, signature, webhookSecret);
          
          if (!isValidSignature) {
            console.warn('Invalid webhook signature');
            res.status(403).json({ error: 'Invalid signature' });
            return;
          }
        }

        // Process the webhook event
        const event: WhatsAppWebhookEvent = req.body;
        await WebhookService.processWhatsAppWebhook(event);

        res.status(200).json({ success: true });
        return;
      }

      // Method not allowed
      res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
      console.error('Error handling WhatsApp webhook:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get webhook configuration template
   */
  static async getWebhookConfig(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const config = WebhookService.getWebhookConfigTemplate();
      
      // Generate URL for this instance
      const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
      const webhookUrl = `${baseUrl}/api/webhooks/whatsapp`;

      res.json({
        success: true,
        webhook_url: webhookUrl,
        verify_token: process.env.WHATSAPP_WEBHOOK_TOKEN || 'Configure WHATSAPP_WEBHOOK_TOKEN',
        configuration: config
      });
    } catch (error) {
      console.error('Error getting webhook config:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Test webhook connectivity
   */
  static async testWebhookConnectivity(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { webhookUrl } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      if (!webhookUrl) {
        res.status(400).json({
          success: false,
          error: 'URL do webhook é obrigatória'
        });
        return;
      }

      // Validate URL format
      const validation = WebhookService.validateWebhookUrl(webhookUrl);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: 'URL do webhook inválida',
          details: validation.errors
        });
        return;
      }

      // Test connectivity
      const testResult = await WebhookService.testWebhookConnectivity(webhookUrl);

      if (testResult.success) {
        res.json({
          success: true,
          message: testResult.message,
          details: testResult.details
        });
      } else {
        res.status(400).json({
          success: false,
          message: testResult.message,
          details: testResult.details
        });
      }
    } catch (error) {
      console.error('Error testing webhook connectivity:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Generate webhook verification token
   */
  static async generateWebhookToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const verifyToken = WebhookService.generateVerificationToken();
      const secret = WebhookService.generateWebhookSecret();

      res.json({
        success: true,
        verify_token: verifyToken,
        webhook_secret: secret,
        instructions: [
          'Configure WHATSAPP_WEBHOOK_TOKEN em suas variáveis de ambiente',
          'Configure WHATSAPP_WEBHOOK_SECRET para verificação de assinatura (opcional)',
          'Use o verify_token na configuração do webhook no Meta for Developers'
        ]
      });
    } catch (error) {
      console.error('Error generating webhook token:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Get webhook status and statistics
   */
  static async getWebhookStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
      const webhookUrl = `${baseUrl}/api/webhooks/whatsapp`;
      const isConfigured = !!(process.env.WHATSAPP_WEBHOOK_TOKEN);

      res.json({
        success: true,
        webhook_status: {
          configured: isConfigured,
          url: webhookUrl,
          verify_token_set: !!process.env.WHATSAPP_WEBHOOK_TOKEN,
          secret_set: !!process.env.WHATSAPP_WEBHOOK_SECRET,
          base_url_configured: !!process.env.BASE_URL
        },
        environment_variables: {
          WHATSAPP_WEBHOOK_TOKEN: process.env.WHATSAPP_WEBHOOK_TOKEN ? 'Configurado' : 'Não configurado',
          WHATSAPP_WEBHOOK_SECRET: process.env.WHATSAPP_WEBHOOK_SECRET ? 'Configurado' : 'Não configurado',
          BASE_URL: process.env.BASE_URL || 'Não configurado (usando URL da requisição)'
        }
      });
    } catch (error) {
      console.error('Error getting webhook status:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
}