import { SettingsRepository } from '../repositories/settingsRepository.js';
import { Code, ConnectivityTestResult, ServiceError } from '../models/types.js';
import { RetryHandler, whatsappCircuitBreaker } from '../utils/retryHandler.js';
import fetch from 'node-fetch';

export class WhatsAppService {
  /**
   * Enviar códigos via WhatsApp
   */
  static async sendCodes(
    userId: string,
    codes: Code[],
    phoneNumber: string,
    customMessage?: string
  ): Promise<{
    success: boolean;
    sentCount: number;
    failedCount: number;
    errors: string[];
  }> {
    try {
      // Buscar configurações do usuário
      const config = await SettingsRepository.getWhatsAppConfig(userId);
      
      if (!config) {
        throw new Error('Configurações do WhatsApp não encontradas. Configure primeiro nas configurações.');
      }

      // Validar número de telefone
      const cleanPhoneNumber = this.cleanPhoneNumber(phoneNumber);
      if (!this.isValidPhoneNumber(cleanPhoneNumber)) {
        throw new Error('Número de telefone inválido. Use o formato: +5511999999999');
      }

      // Preparar mensagem
      const message = this.formatMessage(codes, customMessage);
      
      // Enviar mensagem
      const result = await this.sendWhatsAppMessage(
        config.access_token,
        config.phone_number_id,
        cleanPhoneNumber,
        message
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
          errors: [result.error || 'Erro desconhecido ao enviar WhatsApp']
        };
      }
    } catch (error) {
      console.error('Erro no serviço WhatsApp:', error);
      return {
        success: false,
        sentCount: 0,
        failedCount: codes.length,
        errors: [error instanceof Error ? error.message : 'Erro interno do servidor']
      };
    }
  }

  /**
   * Enviar mensagem via WhatsApp Business API com retry e circuit breaker
   */
  private static async sendWhatsAppMessage(
    accessToken: string,
    phoneNumberId: string,
    to: string,
    message: string
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      return await whatsappCircuitBreaker.execute(async () => {
        return await RetryHandler.executeWithRetryAndTimeout(
          async () => {
            const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
            
            const payload = {
              messaging_product: 'whatsapp',
              to: to,
              type: 'text',
              text: {
                body: message
              }
            };

            const startTime = Date.now();
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            });

            const responseTime = Date.now() - startTime;
            const responseData = await response.json() as any;

            if (response.ok && responseData.messages) {
              console.log(`[WhatsApp] Message sent successfully in ${responseTime}ms to ${to}`);
              return {
                success: true,
                messageId: responseData.messages[0]?.id
              };
            } else {
              const errorMsg = responseData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
              console.error('WhatsApp API Error:', {
                status: response.status,
                error: responseData.error,
                responseTime
              });

              // Determine if error is retryable
              const isRetryable = response.status >= 500 || 
                                response.status === 429 || 
                                response.status === 408;

              throw new Error(isRetryable ? `Retryable error: ${errorMsg}` : `Non-retryable error: ${errorMsg}`);
            }
          },
          {
            max_attempts: 3,
            initial_delay: 1000,
            max_delay: 5000,
            exponential_base: 2
          },
          15000, // 15 second timeout
          `WhatsApp message to ${to}`
        );
      }, 'WhatsApp Send Message');
    } catch (error) {
      console.error('WhatsApp service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro de conexão com a API do WhatsApp'
      };
    }
  }

  /**
   * Formatar mensagem com códigos
   */
  private static formatMessage(codes: Code[], customMessage?: string): string {
    const header = customMessage || '🎯 *Códigos de Recarga*\n\n';
    
    let message = header;
    
    codes.forEach((code, index) => {
      message += `${index + 1}. *${code.combined_code}*`;
      if (code.column_a_value && code.column_a_value !== code.combined_code) {
        message += ` - ${code.column_a_value}`;
      }
      message += '\n';
    });
    
    message += '\n📱 *EnviaCódigo* - Sistema de Distribuição de Códigos';
    
    return message;
  }

  /**
   * Limpar número de telefone
   */
  private static cleanPhoneNumber(phoneNumber: string): string {
    // Remover todos os caracteres não numéricos exceto o +
    let cleaned = phoneNumber.replace(/[^+\d]/g, '');
    
    // Se não começar com +, adicionar +55 (Brasil)
    if (!cleaned.startsWith('+')) {
      // Se começar com 55, adicionar apenas o +
      if (cleaned.startsWith('55')) {
        cleaned = '+' + cleaned;
      } else {
        // Adicionar +55 para números brasileiros
        cleaned = '+55' + cleaned;
      }
    }
    
    return cleaned;
  }

  /**
   * Validar número de telefone
   */
  private static isValidPhoneNumber(phoneNumber: string): boolean {
    // Verificar formato básico: +[código do país][número]
    const phoneRegex = /^\+\d{10,15}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Testar configuração do WhatsApp com diagnósticos completos
   */
  static async testConfiguration(userId: string): Promise<ConnectivityTestResult> {
    const startTime = Date.now();
    
    try {
      const config = await SettingsRepository.getWhatsAppConfig(userId);
      
      if (!config) {
        return {
          success: false,
          message: 'Configurações do WhatsApp não encontradas',
          details: {
            service_type: 'whatsapp',
            error_code: 'CONFIG_NOT_FOUND',
            suggestions: [
              'Configure suas credenciais do WhatsApp Business API',
              'Verifique se o Access Token e Phone Number ID foram fornecidos'
            ]
          },
          timestamp: new Date()
        };
      }

      // Validate credentials format
      if (!config.access_token.startsWith('EAAG')) {
        return {
          success: false,
          message: 'Formato do Access Token inválido',
          details: {
            service_type: 'whatsapp',
            error_code: 'INVALID_TOKEN_FORMAT',
            suggestions: [
              'O Access Token deve começar com "EAAG"',
              'Verifique se copiou o token completo do Meta for Developers'
            ]
          },
          timestamp: new Date()
        };
      }

      // Test API connectivity with retry
      return await RetryHandler.executeWithRetryAndTimeout(
        async () => {
          const url = `https://graph.facebook.com/v18.0/${config.phone_number_id}`;
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${config.access_token}`
            }
          });

          const responseTime = Date.now() - startTime;
          const responseData = await response.json() as any;

          if (response.ok) {
            return {
              success: true,
              message: `Conectado com sucesso! Número: ${responseData.display_phone_number || 'N/A'}`,
              details: {
                service_type: 'whatsapp' as const,
                endpoint: url,
                response_time: responseTime,
                status_code: response.status,
                suggestions: [
                  'Configuração válida e funcionando',
                  'Você pode enviar códigos via WhatsApp'
                ]
              },
              timestamp: new Date()
            };
          } else {
            let errorCode = 'UNKNOWN_ERROR';
            let suggestions: string[] = [];

            switch (response.status) {
              case 401:
                errorCode = 'INVALID_TOKEN';
                suggestions = [
                  'Access Token inválido ou expirado',
                  'Gere um novo token no Meta for Developers',
                  'Verifique se o token tem as permissões necessárias'
                ];
                break;
              case 403:
                errorCode = 'INSUFFICIENT_PERMISSIONS';
                suggestions = [
                  'Token sem permissões suficientes',
                  'Verifique as permissões do app no Meta for Developers',
                  'Adicione a permissão whatsapp_business_messaging'
                ];
                break;
              case 404:
                errorCode = 'PHONE_NUMBER_NOT_FOUND';
                suggestions = [
                  'Phone Number ID não encontrado',
                  'Verifique se o ID está correto no Meta for Developers',
                  'Confirme se o número está associado ao seu app'
                ];
                break;
              case 429:
                errorCode = 'RATE_LIMITED';
                suggestions = [
                  'Muitas tentativas de teste',
                  'Aguarde alguns minutos antes de testar novamente'
                ];
                break;
              default:
                suggestions = [
                  'Erro na API do WhatsApp',
                  'Verifique suas credenciais',
                  'Tente novamente em alguns minutos'
                ];
            }

            return {
              success: false,
              message: `Erro ${response.status}: ${responseData.error?.message || response.statusText}`,
              details: {
                service_type: 'whatsapp' as const,
                endpoint: url,
                response_time: responseTime,
                status_code: response.status,
                error_code: errorCode,
                suggestions
              },
              timestamp: new Date()
            };
          }
        },
        {
          max_attempts: 2,
          initial_delay: 1000,
          max_delay: 3000
        },
        10000, // 10 second timeout
        'WhatsApp Configuration Test'
      );
    } catch (error) {
      console.error('Erro ao testar configuração WhatsApp:', error);
      const responseTime = Date.now() - startTime;
      
      return {
        success: false,
        message: 'Erro de conexão com a API do WhatsApp',
        details: {
          service_type: 'whatsapp',
          response_time: responseTime,
          error_code: 'CONNECTION_ERROR',
          suggestions: [
            'Verifique sua conexão com a internet',
            'Confirme se os serviços do Meta estão funcionando',
            'Tente novamente em alguns minutos'
          ]
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Obter informações do número de telefone configurado
   */
  static async getPhoneNumberInfo(userId: string): Promise<{
    success: boolean;
    phoneNumber?: string;
    displayName?: string;
    error?: string;
  }> {
    try {
      const config = await SettingsRepository.getWhatsAppConfig(userId);
      
      if (!config) {
        return {
          success: false,
          error: 'Configurações não encontradas'
        };
      }

      const url = `https://graph.facebook.com/v18.0/${config.phone_number_id}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json() as any;
        return {
          success: true,
          phoneNumber: data.display_phone_number,
          displayName: data.verified_name
        };
      } else {
        return {
          success: false,
          error: 'Erro ao buscar informações do número'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Erro de conexão'
      };
    }
  }
}