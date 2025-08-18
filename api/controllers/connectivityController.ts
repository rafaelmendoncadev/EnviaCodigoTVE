import { Request, Response } from 'express';
import { WhatsAppService } from '../services/whatsappService.js';
import { EmailService } from '../services/emailService.js';
import { AuthRequest } from '../middleware/auth.js';

export class ConnectivityController {
  /**
   * Enhanced WhatsApp connectivity test
   */
  static async testWhatsAppConnection(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const result = await WhatsAppService.testConfiguration(userId);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        success: result.success,
        message: result.message,
        details: result.details,
        timestamp: result.timestamp,
        test_type: 'whatsapp_connectivity'
      });
    } catch (error) {
      console.error('Error testing WhatsApp connection:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        test_type: 'whatsapp_connectivity'
      });
    }
  }

  /**
   * Enhanced Email connectivity test
   */
  static async testEmailConnection(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const result = await EmailService.testConfiguration(userId);
      
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        success: result.success,
        message: result.message,
        details: result.details,
        timestamp: result.timestamp,
        test_type: 'email_connectivity'
      });
    } catch (error) {
      console.error('Error testing Email connection:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        test_type: 'email_connectivity'
      });
    }
  }

  /**
   * Run comprehensive connectivity tests for both services
   */
  static async runFullConnectivityTest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const startTime = Date.now();

      // Run both tests in parallel
      const [whatsappResult, emailResult] = await Promise.allSettled([
        WhatsAppService.testConfiguration(userId),
        EmailService.testConfiguration(userId)
      ]);

      const totalTime = Date.now() - startTime;

      const response = {
        success: true,
        message: 'Teste de conectividade completo executado',
        total_time: totalTime,
        timestamp: new Date(),
        results: {
          whatsapp: whatsappResult.status === 'fulfilled' 
            ? whatsappResult.value 
            : {
                success: false,
                message: 'Erro ao testar WhatsApp',
                details: {
                  service_type: 'whatsapp',
                  error_code: 'TEST_FAILED',
                  suggestions: ['Erro interno durante o teste']
                },
                timestamp: new Date()
              },
          email: emailResult.status === 'fulfilled' 
            ? emailResult.value 
            : {
                success: false,
                message: 'Erro ao testar Email',
                details: {
                  service_type: 'email',
                  error_code: 'TEST_FAILED',
                  suggestions: ['Erro interno durante o teste']
                },
                timestamp: new Date()
              }
        },
        summary: {
          whatsapp_status: whatsappResult.status === 'fulfilled' && whatsappResult.value.success ? 'connected' : 'failed',
          email_status: emailResult.status === 'fulfilled' && emailResult.value.success ? 'connected' : 'failed',
          overall_status: (
            whatsappResult.status === 'fulfilled' && whatsappResult.value.success &&
            emailResult.status === 'fulfilled' && emailResult.value.success
          ) ? 'all_connected' : 'partial_or_failed'
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Error running full connectivity test:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        test_type: 'full_connectivity'
      });
    }
  }

  /**
   * Get connectivity test history and statistics
   */
  static async getConnectivityHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      // In a real implementation, this would fetch from database
      // For now, return mock data
      const mockHistory = {
        user_id: userId,
        last_24_hours: {
          whatsapp_tests: 5,
          whatsapp_success_rate: 100,
          email_tests: 3,
          email_success_rate: 66.7,
          average_response_time: 1250
        },
        recent_tests: [
          {
            timestamp: new Date(Date.now() - 3600000), // 1 hour ago
            service: 'whatsapp',
            success: true,
            response_time: 800,
            message: 'Conectado com sucesso'
          },
          {
            timestamp: new Date(Date.now() - 7200000), // 2 hours ago
            service: 'email',
            success: false,
            response_time: 5000,
            message: 'Erro de autenticação SMTP'
          }
        ],
        service_status: {
          whatsapp: {
            last_successful_test: new Date(Date.now() - 3600000),
            last_failed_test: new Date(Date.now() - 86400000), // 24 hours ago
            current_status: 'connected',
            uptime_percentage: 98.5
          },
          email: {
            last_successful_test: new Date(Date.now() - 14400000), // 4 hours ago
            last_failed_test: new Date(Date.now() - 7200000), // 2 hours ago
            current_status: 'unstable',
            uptime_percentage: 75.0
          }
        }
      };

      res.json({
        success: true,
        history: mockHistory
      });
    } catch (error) {
      console.error('Error getting connectivity history:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Get detailed diagnostic information
   */
  static async getDiagnosticInfo(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const diagnostics = {
        system_info: {
          node_version: process.version,
          platform: process.platform,
          memory_usage: process.memoryUsage(),
          uptime: process.uptime()
        },
        network_info: {
          environment: process.env.NODE_ENV || 'development',
          base_url: process.env.BASE_URL || 'Not configured',
          proxy_settings: 'None configured'
        },
        service_endpoints: {
          whatsapp_api: 'https://graph.facebook.com/v18.0/',
          meta_status: 'https://developers.facebook.com/status/',
          smtp_test_ports: [25, 465, 587, 2525]
        },
        security_info: {
          jwt_configured: !!process.env.JWT_SECRET,
          webhook_token_set: !!process.env.WHATSAPP_WEBHOOK_TOKEN,
          webhook_secret_set: !!process.env.WHATSAPP_WEBHOOK_SECRET,
          cors_enabled: true
        },
        troubleshooting_tips: [
          'Verifique se suas credenciais estão corretas e atualizadas',
          'Confirme se sua conexão com a internet está estável',
          'Para Gmail, use App Passwords em vez da senha normal',
          'Verifique se não há firewall bloqueando as conexões',
          'Confirme se os serviços externos (Meta, SMTP) estão funcionando'
        ]
      };

      res.json({
        success: true,
        diagnostics: diagnostics,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error getting diagnostic info:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
}