import { WhatsAppWebhookEvent, WebhookConfig } from '../models/types.js';
import { UploadRepository } from '../repositories/uploadRepository.js';
import crypto from 'crypto';

export class WebhookService {
  /**
   * Verify WhatsApp webhook signature
   */
  static verifyWhatsAppSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      // WhatsApp sends signature as sha256=<signature>
      const signatureToVerify = signature.replace('sha256=', '');
      
      // Create HMAC hash
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const computedSignature = hmac.digest('hex');
      
      // Compare signatures
      return crypto.timingSafeEqual(
        Buffer.from(signatureToVerify, 'hex'),
        Buffer.from(computedSignature, 'hex')
      );
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Verify webhook token for initial setup
   */
  static verifyWebhookToken(
    mode: string,
    token: string,
    challenge: string,
    expectedToken: string
  ): string | null {
    // Check if this is a verification request
    if (mode === 'subscribe' && token === expectedToken) {
      console.log('Webhook verification successful');
      return challenge;
    }
    
    console.warn('Webhook verification failed:', { mode, token, expectedToken });
    return null;
  }

  /**
   * Process WhatsApp webhook event
   */
  static async processWhatsAppWebhook(event: WhatsAppWebhookEvent): Promise<void> {
    try {
      console.log('Processing WhatsApp webhook event:', JSON.stringify(event, null, 2));

      if (event.object !== 'whatsapp_business_account') {
        console.warn('Webhook event is not for WhatsApp Business Account');
        return;
      }

      for (const entry of event.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            await this.processMessageStatusUpdates(change.value);
          }
        }
      }
    } catch (error) {
      console.error('Error processing WhatsApp webhook:', error);
    }
  }

  /**
   * Process message status updates
   */
  private static async processMessageStatusUpdates(value: any): Promise<void> {
    try {
      // Process message status updates if present
      if (value.statuses && Array.isArray(value.statuses)) {
        for (const status of value.statuses) {
          await this.updateMessageStatus(status);
        }
      }

      // Process incoming messages if needed
      if (value.messages && Array.isArray(value.messages)) {
        console.log('Received incoming messages:', value.messages.length);
        // Could implement auto-reply or message logging here
      }
    } catch (error) {
      console.error('Error processing message status updates:', error);
    }
  }

  /**
   * Update message status in database
   */
  private static async updateMessageStatus(status: any): Promise<void> {
    try {
      const { id, status: messageStatus, timestamp, recipient_id, errors } = status;
      
      console.log(`Message ${id} status update:`, {
        status: messageStatus,
        recipient: recipient_id,
        timestamp,
        errors
      });

      // Here you could update the database with message delivery status
      // For example, update the codes table with delivery confirmation
      
      // Find codes that were sent with this message ID
      // This would require storing message IDs when sending
      // await UploadRepository.updateCodeDeliveryStatus(messageId, messageStatus);

      // Log delivery status for monitoring
      if (messageStatus === 'delivered') {
        console.log(`✅ Message ${id} delivered successfully to ${recipient_id}`);
      } else if (messageStatus === 'failed') {
        console.error(`❌ Message ${id} failed to deliver to ${recipient_id}:`, errors);
      } else if (messageStatus === 'read') {
        console.log(`📖 Message ${id} read by ${recipient_id}`);
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  }

  /**
   * Get webhook configuration template
   */
  static getWebhookConfigTemplate(): {
    whatsapp: {
      description: string;
      steps: string[];
      verification_note: string;
      callback_url_format: string;
    };
  } {
    return {
      whatsapp: {
        description: 'Configure webhooks para receber atualizações de status das mensagens do WhatsApp',
        steps: [
          'No Meta for Developers, vá para seu app > WhatsApp > Configuration',
          'Em "Webhook", clique em "Configure"',
          'Insira a URL do webhook: [SEU_DOMINIO]/api/webhooks/whatsapp',
          'Insira o token de verificação configurado no sistema',
          'Selecione os campos: "messages"',
          'Clique em "Verify and Save"'
        ],
        verification_note: 'O sistema irá responder automaticamente durante a verificação',
        callback_url_format: 'https://[SEU_DOMINIO]/api/webhooks/whatsapp'
      }
    };
  }

  /**
   * Test webhook connectivity
   */
  static async testWebhookConnectivity(webhookUrl: string): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      // Send a test GET request to verify the webhook endpoint is accessible
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'EnviaCodigo-Webhook-Test/1.0'
        }
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Webhook endpoint is accessible',
          details: {
            status: response.status,
            statusText: response.statusText
          }
        };
      } else {
        return {
          success: false,
          message: `Webhook endpoint returned ${response.status}: ${response.statusText}`,
          details: {
            status: response.status,
            statusText: response.statusText
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to connect to webhook endpoint',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Generate webhook verification token
   */
  static generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate webhook secret for signature verification
   */
  static generateWebhookSecret(): string {
    return crypto.randomBytes(32).toString('base64');
  }

  /**
   * Validate webhook URL format
   */
  static validateWebhookUrl(url: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      const parsedUrl = new URL(url);
      
      // Must be HTTPS for production
      if (parsedUrl.protocol !== 'https:') {
        errors.push('Webhook URL deve usar HTTPS para produção');
      }

      // Must not be localhost for production webhooks
      if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
        errors.push('URLs localhost não funcionam para webhooks em produção');
      }

      // Must have valid path
      if (!parsedUrl.pathname || parsedUrl.pathname === '/') {
        errors.push('URL deve ter um path específico (ex: /api/webhooks/whatsapp)');
      }
    } catch (error) {
      errors.push('URL inválida');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}