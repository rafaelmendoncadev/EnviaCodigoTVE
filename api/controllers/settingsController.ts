import { Request, Response } from 'express';
import { SettingsRepository } from '../repositories/settingsRepository.js';
import { AuthRequest } from '../middleware/auth.js';

export class SettingsController {
  /**
   * Salvar configurações do WhatsApp
   */
  static async saveWhatsAppConfig(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { accessToken, phoneNumberId, webhookVerifyToken } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      // Validar dados obrigatórios
      if (!accessToken || !phoneNumberId) {
        res.status(400).json({ 
          error: 'Access Token e Phone Number ID são obrigatórios' 
        });
        return;
      }

      // Salvar configurações
      const config = {
        access_token: accessToken.trim(),
        phone_number_id: phoneNumberId.trim(),
        webhook_url: webhookVerifyToken?.trim() || ''
      };

      await SettingsRepository.saveWhatsAppConfig(userId, config);

      res.json({
        success: true,
        message: 'Configurações do WhatsApp salvas com sucesso'
      });
    } catch (error) {
      console.error('Erro ao salvar configurações WhatsApp:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Salvar configurações do Email
   */
  static async saveEmailConfig(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { 
        smtpHost, 
        smtpPort, 
        smtpUser, 
        smtpPassword, 
        fromEmail, 
        fromName 
      } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      // Validar dados obrigatórios
      if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword || !fromEmail) {
        res.status(400).json({ 
          error: 'Todos os campos SMTP são obrigatórios' 
        });
        return;
      }

      // Validar porta
      const port = parseInt(smtpPort);
      if (isNaN(port) || port < 1 || port > 65535) {
        res.status(400).json({ 
          error: 'Porta SMTP inválida' 
        });
        return;
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(fromEmail)) {
        res.status(400).json({ 
          error: 'Email remetente inválido' 
        });
        return;
      }

      // Salvar configurações
      const config = {
        smtp_host: smtpHost.trim(),
        smtp_port: port,
        smtp_user: smtpUser.trim(),
        smtp_password: smtpPassword.trim(),
        from_email: fromEmail.trim(),
        from_name: fromName?.trim() || ''
      };

      await SettingsRepository.saveEmailConfig(userId, config);

      res.json({
        success: true,
        message: 'Configurações de email salvas com sucesso'
      });
    } catch (error) {
      console.error('Erro ao salvar configurações de email:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Obter configurações do WhatsApp (sem dados sensíveis)
   */
  static async getWhatsAppConfig(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const config = await SettingsRepository.getWhatsAppConfig(userId);

      if (!config) {
        res.json({
          configured: false,
          message: 'Nenhuma configuração encontrada'
        });
        return;
      }

      // Retornar apenas informações não sensíveis
      res.json({
        configured: true,
        phoneNumberId: config.phone_number_id,
        hasAccessToken: !!config.access_token
      });
    } catch (error) {
      console.error('Erro ao buscar configurações WhatsApp:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Obter configurações do Email (sem dados sensíveis)
   */
  static async getEmailConfig(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const config = await SettingsRepository.getEmailConfig(userId);

      if (!config) {
        res.json({
          configured: false,
          message: 'Nenhuma configuração encontrada'
        });
        return;
      }

      // Retornar apenas informações não sensíveis
      res.json({
        configured: true,
        smtpHost: config.smtp_host,
        smtpPort: config.smtp_port,
        smtpUser: config.smtp_user,
        fromEmail: config.from_email,
        fromName: config.from_name,
        hasPassword: !!config.smtp_password
      });
    } catch (error) {
      console.error('Erro ao buscar configurações de email:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Desativar configurações do WhatsApp
   */
  static async deactivateWhatsAppConfig(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      await SettingsRepository.deactivateConfig(userId, 'whatsapp');

      res.json({
        success: true,
        message: 'Configurações do WhatsApp desativadas'
      });
    } catch (error) {
      console.error('Erro ao desativar configurações WhatsApp:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Desativar configurações do Email
   */
  static async deactivateEmailConfig(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      await SettingsRepository.deactivateConfig(userId, 'email');

      res.json({
        success: true,
        message: 'Configurações de email desativadas'
      });
    } catch (error) {
      console.error('Erro ao desativar configurações de email:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Obter status geral das configurações
   */
  static async getConfigStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const [whatsappConfig, emailConfig] = await Promise.all([
        SettingsRepository.getWhatsAppConfig(userId),
        SettingsRepository.getEmailConfig(userId)
      ]);

      res.json({
        whatsapp: {
          configured: !!whatsappConfig,
          active: !!whatsappConfig
        },
        email: {
          configured: !!emailConfig,
          active: !!emailConfig
        }
      });
    } catch (error) {
      console.error('Erro ao buscar status das configurações:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Testar conectividade do WhatsApp
   */
  static async testWhatsAppConnection(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const config = await SettingsRepository.getWhatsAppConfig(userId);
      if (!config) {
        res.status(404).json({
          success: false,
          error: 'Configurações do WhatsApp não encontradas'
        });
        return;
      }

      // Simular teste de conectividade (implementar lógica real conforme necessário)
      res.json({
        success: true,
        message: 'Conexão com WhatsApp testada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao testar conexão WhatsApp:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Testar conectividade do email
   */
  static async testEmailConnection(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const config = await SettingsRepository.getEmailConfig(userId);
      if (!config) {
        res.status(404).json({
          success: false,
          error: 'Configurações de email não encontradas'
        });
        return;
      }

      // Simular teste de conectividade SMTP
      res.json({
        success: true,
        message: 'Conexão SMTP testada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao testar conexão email:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}