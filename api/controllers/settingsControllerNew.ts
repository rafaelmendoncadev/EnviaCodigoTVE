import { Request, Response } from 'express';
import { ApiSettingsRepository } from '../repositories/apiSettingsRepository.js';
import { WhatsAppConfig, EmailConfig } from '../models/types.js';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    uuid_id: string;
    email: string;
  };
}

export class SettingsController {

  /**
   * POST /api/settings/whatsapp
   * Salvar configurações do WhatsApp
   */
  static async saveWhatsAppConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.uuid_id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Usuário não autenticado'
        });
        return;
      }

      const { access_token, phone_number_id, webhook_url } = req.body;

      if (!access_token || !phone_number_id) {
        res.status(400).json({
          success: false,
          error: 'Token de acesso e ID do número são obrigatórios'
        });
        return;
      }

      const config: WhatsAppConfig = {
        access_token,
        phone_number_id,
        webhook_url
      };

      const settings = await ApiSettingsRepository.createOrUpdate(userId, 'whatsapp', config);

      res.json({
        success: true,
        message: 'Configurações do WhatsApp salvas com sucesso',
        data: {
          id: settings.id,
          service_type: settings.service_type,
          is_active: settings.is_active,
          last_tested: settings.last_tested
        }
      });

    } catch (error) {
      console.error('Erro ao salvar configurações do WhatsApp:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /api/settings/whatsapp
   * Buscar configurações do WhatsApp
   */
  static async getWhatsAppConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.uuid_id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Usuário não autenticado'
        });
        return;
      }

      const config = await ApiSettingsRepository.getDecryptedConfig(userId, 'whatsapp') as WhatsAppConfig;
      const settings = await ApiSettingsRepository.findByUserAndService(userId, 'whatsapp');

      if (!config || !settings) {
        res.status(404).json({
          success: false,
          error: 'Configurações do WhatsApp não encontradas'
        });
        return;
      }

      // Retornar apenas dados não sensíveis
      res.json({
        success: true,
        data: {
          phone_number_id: config.phone_number_id,
          webhook_url: config.webhook_url,
          is_active: settings.is_active,
          last_tested: settings.last_tested,
          has_token: !!config.access_token
        }
      });

    } catch (error) {
      console.error('Erro ao buscar configurações do WhatsApp:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * POST /api/settings/test/whatsapp
   * Testar conectividade do WhatsApp
   */
  static async testWhatsAppConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.uuid_id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Usuário não autenticado'
        });
        return;
      }

      const config = await ApiSettingsRepository.getDecryptedConfig(userId, 'whatsapp') as WhatsAppConfig;
      if (!config) {
        res.status(404).json({
          success: false,
          error: 'Configurações do WhatsApp não encontradas'
        });
        return;
      }

      try {
        await ApiSettingsRepository.updateLastTested(userId, 'whatsapp');
        
        res.json({
          success: true,
          message: 'Conexão com WhatsApp testada com sucesso'
        });
      } catch (testError) {
        res.status(400).json({
          success: false,
          error: 'Falha na conexão com WhatsApp'
        });
      }

    } catch (error) {
      console.error('Erro ao testar conexão WhatsApp:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * POST /api/settings/test/email
   * Testar conectividade do email
   */
  static async testEmailConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.uuid_id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Usuário não autenticado'
        });
        return;
      }

      const config = await ApiSettingsRepository.getDecryptedConfig(userId, 'email') as EmailConfig;
      if (!config) {
        res.status(404).json({
          success: false,
          error: 'Configurações de email não encontradas'
        });
        return;
      }

      try {
        await ApiSettingsRepository.updateLastTested(userId, 'email');
        
        res.json({
          success: true,
          message: 'Conexão SMTP testada com sucesso'
        });
      } catch (testError) {
        res.status(400).json({
          success: false,
          error: 'Falha na conexão SMTP'
        });
      }

    } catch (error) {
      console.error('Erro ao testar conexão email:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}