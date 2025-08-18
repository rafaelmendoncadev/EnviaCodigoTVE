import { SettingsRepository } from '../repositories/settingsRepository.js';
import { Code, ConnectivityTestResult } from '../models/types.js';
import { RetryHandler, emailCircuitBreaker } from '../utils/retryHandler.js';
import nodemailer from 'nodemailer';
import { createTransport, Transporter } from 'nodemailer';

export class EmailService {
  /**
   * Enviar códigos via email
   */
  static async sendCodes(
    userId: string,
    codes: Code[],
    toEmail: string,
    subject?: string,
    customMessage?: string
  ): Promise<{
    success: boolean;
    sentCount: number;
    failedCount: number;
    errors: string[];
  }> {
    try {
      // Buscar configurações do usuário
      const config = await SettingsRepository.getEmailConfig(userId);
      
      if (!config) {
        throw new Error('Configurações de email não encontradas. Configure primeiro nas configurações.');
      }

      // Validar email
      if (!this.isValidEmail(toEmail)) {
        throw new Error('Endereço de email inválido.');
      }

      // Criar transporter
      const transporter = await this.createTransporter(config);
      
      // Preparar conteúdo do email
      const emailContent = this.formatEmailContent(codes, customMessage);
      const emailSubject = subject || `Códigos de Recarga - ${new Date().toLocaleDateString('pt-BR')}`;
      
      // Enviar email
      const result = await this.sendEmail(
        transporter,
        config.from_email,
        toEmail,
        emailSubject,
        emailContent
      );

      if (result.success) {
        return {
          success: true,
          sentCount: codes.length,
          failedCount: 0,
          errors: []
        };
      } else {
        return {
          success: false,
          sentCount: 0,
          failedCount: codes.length,
          errors: [result.error || 'Erro desconhecido ao enviar email']
        };
      }
    } catch (error) {
      console.error('Erro no serviço de email:', error);
      return {
        success: false,
        sentCount: 0,
        failedCount: codes.length,
        errors: [error instanceof Error ? error.message : 'Erro interno do servidor']
      };
    }
  }

  /**
   * Criar transporter do nodemailer
   */
  private static async createTransporter(config: any): Promise<Transporter> {
    const transporterConfig: any = {
      host: config.smtp_host,
      port: config.smtp_port,
      secure: config.smtp_port === 465, // true para 465, false para outras portas
      auth: {
        user: config.smtp_user,
        pass: config.smtp_password
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 5000,    // 5 seconds
      socketTimeout: 10000      // 10 seconds
    };

    // Configurações específicas para provedores conhecidos
    if (config.smtp_host.includes('gmail.com')) {
      transporterConfig.service = 'gmail';
    } else if (config.smtp_host.includes('outlook.com') || config.smtp_host.includes('hotmail.com')) {
      transporterConfig.service = 'hotmail';
    } else if (config.smtp_host.includes('yahoo.com')) {
      transporterConfig.service = 'yahoo';
    }

    return createTransport(transporterConfig);
  }

  /**
   * Enviar email com retry e circuit breaker
   */
  private static async sendEmail(
    transporter: Transporter,
    from: string,
    to: string,
    subject: string,
    content: { html: string; text: string }
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      return await emailCircuitBreaker.execute(async () => {
        return await RetryHandler.executeWithRetryAndTimeout(
          async () => {
            const mailOptions = {
              from: from,
              to: to,
              subject: subject,
              text: content.text,
              html: content.html
            };

            const startTime = Date.now();
            const info = await transporter.sendMail(mailOptions);
            const responseTime = Date.now() - startTime;
            
            console.log(`[Email] Message sent successfully in ${responseTime}ms to ${to}`);
            
            return {
              success: true,
              messageId: info.messageId
            };
          },
          {
            max_attempts: 3,
            initial_delay: 2000,
            max_delay: 8000,
            exponential_base: 2
          },
          20000, // 20 second timeout for email
          `Email to ${to}`
        );
      }, 'Email Send');
    } catch (error) {
      console.error('Email service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Formatar conteúdo do email (HTML e texto)
   */
  private static formatEmailContent(
    codes: Code[],
    customMessage?: string
  ): { html: string; text: string } {
    const header = customMessage || 'Códigos de Recarga';
    
    // Versão HTML
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${header}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
          .code-item { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 15px; margin-bottom: 10px; }
          .code-number { font-weight: bold; color: #495057; font-size: 18px; }
          .code-description { color: #6c757d; margin-top: 5px; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; }
          .count { background: #28a745; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎯 ${header}</h1>
          <span class="count">${codes.length} código${codes.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="content">
    `;
    
    codes.forEach((code, index) => {
      html += `
        <div class="code-item">
          <div class="code-number">${index + 1}. ${code.combined_code}</div>
          ${code.column_a_value && code.column_a_value !== code.combined_code ?
            `<div class="code-description">${code.column_a_value}</div>` : ''}
        </div>
      `;
    });
    
    html += `
        </div>
        <div class="footer">
          <p>📱 <strong>EnviaCódigo</strong> - Sistema de Distribuição de Códigos</p>
          <p>Enviado em ${new Date().toLocaleString('pt-BR')}</p>
        </div>
      </body>
      </html>
    `;
    
    // Versão texto simples
    let text = `${header}\n\n`;
    
    codes.forEach((code, index) => {
      text += `${index + 1}. ${code.combined_code}`;
      if (code.column_a_value && code.column_a_value !== code.combined_code) {
        text += ` - ${code.column_a_value}`;
      }
      text += '\n';
    });
    
    text += `\n📱 EnviaCódigo - Sistema de Distribuição de Códigos\n`;
    text += `Enviado em ${new Date().toLocaleString('pt-BR')}`;
    
    return { html, text };
  }

  /**
   * Validar email
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Testar configuração de email com diagnósticos completos
   */
  static async testConfiguration(userId: string): Promise<ConnectivityTestResult> {
    const startTime = Date.now();
    
    try {
      const config = await SettingsRepository.getEmailConfig(userId);
      
      if (!config) {
        return {
          success: false,
          message: 'Configurações de email não encontradas',
          details: {
            service_type: 'email',
            error_code: 'CONFIG_NOT_FOUND',
            suggestions: [
              'Configure suas credenciais SMTP',
              'Verifique se todos os campos obrigatórios foram preenchidos'
            ]
          },
          timestamp: new Date()
        };
      }

      // Validate configuration
      const validationErrors: string[] = [];
      
      if (!config.smtp_host) validationErrors.push('Servidor SMTP é obrigatório');
      if (!config.smtp_port || config.smtp_port < 1 || config.smtp_port > 65535) {
        validationErrors.push('Porta SMTP inválida (deve ser entre 1 e 65535)');
      }
      if (!config.smtp_user) validationErrors.push('Usuário SMTP é obrigatório');
      if (!config.smtp_password) validationErrors.push('Senha SMTP é obrigatória');
      if (!config.from_email) validationErrors.push('Email remetente é obrigatório');

      if (validationErrors.length > 0) {
        return {
          success: false,
          message: 'Configuração inválida',
          details: {
            service_type: 'email',
            error_code: 'INVALID_CONFIG',
            suggestions: validationErrors
          },
          timestamp: new Date()
        };
      }

      // Test SMTP connection with retry
      return await RetryHandler.executeWithRetryAndTimeout(
        async () => {
          const transporter = await this.createTransporter(config);
          
          // Verify connection
          await transporter.verify();
          
          const responseTime = Date.now() - startTime;
          
          return {
            success: true,
            message: `Conexão SMTP estabelecida com sucesso! Servidor: ${config.smtp_host}:${config.smtp_port}`,
            details: {
              service_type: 'email' as const,
              endpoint: `${config.smtp_host}:${config.smtp_port}`,
              response_time: responseTime,
              suggestions: [
                'Configuração SMTP válida e funcionando',
                'Você pode enviar códigos via email',
                'Recomendamos fazer um teste de envio'
              ]
            },
            timestamp: new Date()
          };
        },
        {
          max_attempts: 2,
          initial_delay: 2000,
          max_delay: 5000
        },
        15000, // 15 second timeout
        'Email Configuration Test'
      );
    } catch (error) {
      console.error('Erro ao testar configuração de email:', error);
      const responseTime = Date.now() - startTime;
      
      let errorCode = 'CONNECTION_ERROR';
      let suggestions: string[] = [];
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('authentication') || errorMsg.includes('auth')) {
          errorCode = 'AUTHENTICATION_ERROR';
          suggestions = [
            'Verifique se o usuário SMTP está correto',
            'Confirme se a senha está correta',
            'Para Gmail, use App Password em vez da senha normal',
            'Verifique se a autenticação em 2 fatores está configurada'
          ];
        } else if (errorMsg.includes('connection') || errorMsg.includes('timeout') || errorMsg.includes('econnrefused')) {
          errorCode = 'CONNECTION_ERROR';
          suggestions = [
            'Verifique se o servidor SMTP está correto',
            'Confirme se a porta está correta (587 para TLS, 465 para SSL)',
            'Verifique sua conexão com a internet',
            'Confirme se não há firewall bloqueando a conexão'
          ];
        } else if (errorMsg.includes('cert') || errorMsg.includes('ssl') || errorMsg.includes('tls')) {
          errorCode = 'SSL_ERROR';
          suggestions = [
            'Problema com certificado SSL/TLS',
            'Tente usar uma porta diferente (587 ou 465)',
            'Verifique as configurações de segurança do provedor'
          ];
        } else {
          suggestions = [
            'Erro desconhecido na configuração SMTP',
            'Verifique todos os campos novamente',
            'Consulte a documentação do seu provedor de email'
          ];
        }
      }
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro de conexão com o servidor SMTP',
        details: {
          service_type: 'email',
          response_time: responseTime,
          error_code: errorCode,
          suggestions
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Enviar email de teste
   */
  static async sendTestEmail(
    userId: string,
    testEmail: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      if (!this.isValidEmail(testEmail)) {
        return {
          success: false,
          message: 'Endereço de email inválido'
        };
      }

      const testCodes: Code[] = [
        {
          id: 'test-1',
          session_id: 'test-session',
          combined_code: 'TEST123',
           column_a_value: 'Código de teste',
           column_d_value: null,
           row_number: 1,
           status: 'available',
           sent_at: null,
           archived_at: null,
           created_at: new Date()
        }
      ];

      const result = await this.sendCodes(
        userId,
        testCodes,
        testEmail,
        'Teste de Configuração - EnviaCódigo',
        'Este é um email de teste para verificar suas configurações.'
      );

      if (result.success) {
        return {
          success: true,
          message: `Email de teste enviado com sucesso para ${testEmail}`
        };
      } else {
        return {
          success: false,
          message: result.errors.join(', ')
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno'
      };
    }
  }
}