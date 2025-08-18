import { Request, Response } from 'express';
import { WhatsAppService } from '../services/whatsappService.js';
import { EmailService } from '../services/emailService.js';
import { UploadRepository } from '../repositories/uploadRepository.js';
import { AuthRequest } from '../middleware/auth.js';

export class SendController {
  /**
   * Enviar códigos via WhatsApp
   */
  static async sendWhatsApp(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { codeIds, phoneNumber, customMessage } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      // Validar dados de entrada
      if (!codeIds || !Array.isArray(codeIds) || codeIds.length === 0) {
        res.status(400).json({ error: 'IDs dos códigos são obrigatórios' });
        return;
      }

      if (!phoneNumber || typeof phoneNumber !== 'string') {
        res.status(400).json({ error: 'Número de telefone é obrigatório' });
        return;
      }

      // Buscar códigos do usuário
      const codes = [];
      for (const codeId of codeIds) {
        const code = await UploadRepository.findCodeById(codeId);
        if (!code) {
          res.status(404).json({ error: `Código ${codeId} não encontrado` });
          return;
        }

        // Verificar se o código pertence ao usuário
        const session = await UploadRepository.findSessionById(code.session_id);
        if (!session || session.user_id !== userId) {
          res.status(403).json({ error: 'Acesso negado aos códigos selecionados' });
          return;
        }

        // Verificar se o código está disponível
        if (code.status !== 'available') {
          res.status(400).json({ 
            error: `Código ${code.combined_code} não está disponível (status: ${code.status})` 
          });
          return;
        }

        codes.push(code);
      }

      // Enviar via WhatsApp
      const result = await WhatsAppService.sendCodes(
        userId,
        codes,
        phoneNumber,
        customMessage
      );

      if (result.success) {
        // Atualizar status dos códigos para 'sent'
        await UploadRepository.updateCodesStatus(codeIds, 'sent');
        
        res.json({
          success: true,
          message: `${result.sentCount} código(s) enviado(s) com sucesso via WhatsApp`,
          sentCount: result.sentCount,
          failedCount: result.failedCount
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Erro ao enviar códigos via WhatsApp',
          errors: result.errors
        });
      }
    } catch (error) {
      console.error('Erro no controller sendWhatsApp:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Enviar códigos via Email
   */
  static async sendEmail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { codeIds, email, subject, customMessage } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      // Validar dados de entrada
      if (!codeIds || !Array.isArray(codeIds) || codeIds.length === 0) {
        res.status(400).json({ error: 'IDs dos códigos são obrigatórios' });
        return;
      }

      if (!email || typeof email !== 'string') {
        res.status(400).json({ error: 'Email é obrigatório' });
        return;
      }

      // Buscar códigos do usuário
      const codes = [];
      for (const codeId of codeIds) {
        const code = await UploadRepository.findCodeById(codeId);
        if (!code) {
          res.status(404).json({ error: `Código ${codeId} não encontrado` });
          return;
        }

        // Verificar se o código pertence ao usuário
        const session = await UploadRepository.findSessionById(code.session_id);
        if (!session || session.user_id !== userId) {
          res.status(403).json({ error: 'Acesso negado aos códigos selecionados' });
          return;
        }

        // Verificar se o código está disponível
        if (code.status !== 'available') {
          res.status(400).json({ 
            error: `Código ${code.combined_code} não está disponível (status: ${code.status})` 
          });
          return;
        }

        codes.push(code);
      }

      // Enviar via Email
      const result = await EmailService.sendCodes(
        userId,
        codes,
        email,
        subject,
        customMessage
      );

      if (result.success) {
        // Atualizar status dos códigos para 'sent'
        await UploadRepository.updateCodesStatus(codeIds, 'sent');
        
        res.json({
          success: true,
          message: `${result.sentCount} código(s) enviado(s) com sucesso via Email`,
          sentCount: result.sentCount,
          failedCount: result.failedCount
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Erro ao enviar códigos via Email',
          errors: result.errors
        });
      }
    } catch (error) {
      console.error('Erro no controller sendEmail:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Testar configuração WhatsApp
   */
  static async testWhatsApp(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const result = await WhatsAppService.testConfiguration(userId);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Erro ao testar WhatsApp:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Testar configuração Email
   */
  static async testEmail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const result = await EmailService.testConfiguration(userId);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Erro ao testar Email:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Enviar email de teste
   */
  static async sendTestEmail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { testEmail } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      if (!testEmail || typeof testEmail !== 'string') {
        res.status(400).json({ error: 'Email de teste é obrigatório' });
        return;
      }

      const result = await EmailService.sendTestEmail(userId, testEmail);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Erro ao enviar email de teste:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Obter informações do número WhatsApp configurado
   */
  static async getWhatsAppInfo(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const result = await WhatsAppService.getPhoneNumberInfo(userId);
      
      if (result.success) {
        res.json({
          success: true,
          phoneNumber: result.phoneNumber,
          displayName: result.displayName
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Erro ao buscar info WhatsApp:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
}