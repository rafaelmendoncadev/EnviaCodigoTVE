import pool from '../config/database.js';
import { ApiSettings, WhatsAppConfig, EmailConfig } from '../models/types.js';
import { EncryptionUtil } from '../utils/encryption.js';
import { v4 as uuidv4 } from 'uuid';

export class SettingsRepository {
  /**
   * Salvar configurações de WhatsApp
   */
  static async saveWhatsAppConfig(
    userId: string,
    config: WhatsAppConfig
  ): Promise<ApiSettings> {
    try {
      // Criptografar configurações sensíveis
      const encryptedConfig = EncryptionUtil.encryptConfig({
        access_token: config.access_token,
        phone_number_id: config.phone_number_id,
        webhook_url: config.webhook_url || ''
      });

      // Verificar se já existe configuração
      const existingQuery = `
        SELECT id FROM api_settings 
        WHERE user_id = $1 AND service_type = 'whatsapp'
      `;
      const existingResult = await pool.query(existingQuery, [userId]);

      let result;
      if (existingResult.rows.length > 0) {
        // Atualizar configuração existente
        const updateQuery = `
          UPDATE api_settings 
          SET encrypted_config = $1, is_active = $2, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $3 AND service_type = 'whatsapp'
          RETURNING *
        `;
        result = await pool.query(updateQuery, [encryptedConfig, true, userId]);
      } else {
        // Criar nova configuração
        const id = uuidv4();
        const insertQuery = `
          INSERT INTO api_settings (id, user_id, service_type, encrypted_config, is_active)
          VALUES ($1, $2, 'whatsapp', $3, $4)
          RETURNING *
        `;
        result = await pool.query(insertQuery, [id, userId, encryptedConfig, true]);
      }

      return result.rows[0];
    } catch (error) {
      console.error('Erro ao salvar configurações WhatsApp:', error);
      throw new Error('Falha ao salvar configurações WhatsApp');
    }
  }

  /**
   * Salvar configurações de Email
   */
  static async saveEmailConfig(
    userId: string,
    config: EmailConfig
  ): Promise<ApiSettings> {
    try {
      // Criptografar configurações sensíveis
      const encryptedConfig = EncryptionUtil.encryptConfig({
        smtp_host: config.smtp_host,
        smtp_port: config.smtp_port,
        smtp_user: config.smtp_user,
        smtp_password: config.smtp_password,
        from_email: config.from_email,
        from_name: config.from_name || ''
      });

      // Verificar se já existe configuração
      const existingQuery = `
        SELECT id FROM api_settings 
        WHERE user_id = $1 AND service_type = 'email'
      `;
      const existingResult = await pool.query(existingQuery, [userId]);

      let result;
      if (existingResult.rows.length > 0) {
        // Atualizar configuração existente
        const updateQuery = `
          UPDATE api_settings 
          SET encrypted_config = $1, is_active = $2, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $3 AND service_type = 'email'
          RETURNING *
        `;
        result = await pool.query(updateQuery, [encryptedConfig, true, userId]);
      } else {
        // Criar nova configuração
        const id = uuidv4();
        const insertQuery = `
          INSERT INTO api_settings (id, user_id, service_type, encrypted_config, is_active)
          VALUES ($1, $2, 'email', $3, $4)
          RETURNING *
        `;
        result = await pool.query(insertQuery, [id, userId, encryptedConfig, true]);
      }

      return result.rows[0];
    } catch (error) {
      console.error('Erro ao salvar configurações de email:', error);
      throw new Error('Falha ao salvar configurações de email');
    }
  }

  /**
   * Buscar configurações de WhatsApp do usuário
   */
  static async getWhatsAppConfig(userId: string): Promise<WhatsAppConfig | null> {
    try {
      const query = `
        SELECT encrypted_config, is_active FROM api_settings 
        WHERE user_id = $1 AND service_type = 'whatsapp'
      `;
      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0 || !result.rows[0].is_active) {
        return null;
      }

      // Descriptografar configurações
      const decryptedConfig = EncryptionUtil.decryptConfig(result.rows[0].encrypted_config) as any;
      
      return {
        access_token: decryptedConfig.access_token,
        phone_number_id: decryptedConfig.phone_number_id,
        webhook_url: decryptedConfig.webhook_url
      };
    } catch (error) {
      console.error('Erro ao buscar configurações WhatsApp:', error);
      return null;
    }
  }

  /**
   * Buscar configurações de Email do usuário
   */
  static async getEmailConfig(userId: string): Promise<EmailConfig | null> {
    try {
      const query = `
        SELECT encrypted_config, is_active FROM api_settings 
        WHERE user_id = $1 AND service_type = 'email'
      `;
      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0 || !result.rows[0].is_active) {
        return null;
      }

      // Descriptografar configurações
      const decryptedConfig = EncryptionUtil.decryptConfig(result.rows[0].encrypted_config) as any;
      
      return {
        smtp_host: decryptedConfig.smtp_host,
        smtp_port: decryptedConfig.smtp_port,
        smtp_user: decryptedConfig.smtp_user,
        smtp_password: decryptedConfig.smtp_password,
        from_email: decryptedConfig.from_email,
        from_name: decryptedConfig.from_name
      };
    } catch (error) {
      console.error('Erro ao buscar configurações de email:', error);
      return null;
    }
  }

  /**
   * Verificar se configurações estão ativas
   */
  static async getConfigurationStatus(userId: string): Promise<{
    whatsapp: boolean;
    email: boolean;
  }> {
    try {
      const query = `
        SELECT service_type, is_active FROM api_settings 
        WHERE user_id = $1 AND service_type IN ('whatsapp', 'email')
      `;
      const result = await pool.query(query, [userId]);

      const status = {
        whatsapp: false,
        email: false
      };

      result.rows.forEach(row => {
        if (row.service_type === 'whatsapp') {
          status.whatsapp = row.is_active;
        } else if (row.service_type === 'email') {
          status.email = row.is_active;
        }
      });

      return status;
    } catch (error) {
      console.error('Erro ao verificar status das configurações:', error);
      return {
        whatsapp: false,
        email: false
      };
    }
  }

  /**
   * Desativar configuração específica
   */
  static async deactivateConfig(
    userId: string,
    serviceType: 'whatsapp' | 'email'
  ): Promise<void> {
    try {
      const query = `
        UPDATE api_settings 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND service_type = $2
      `;
      await pool.query(query, [userId, serviceType]);
    } catch (error) {
      console.error(`Erro ao desativar configuração ${serviceType}:`, error);
      throw new Error(`Falha ao desativar configuração ${serviceType}`);
    }
  }

  /**
   * Testar conectividade das configurações
   */
  static async testConfiguration(
    userId: string,
    serviceType: 'whatsapp' | 'email'
  ): Promise<boolean> {
    try {
      if (serviceType === 'whatsapp') {
        const config = await this.getWhatsAppConfig(userId);
        return config !== null && !!config.access_token && !!config.phone_number_id;
      } else {
        const config = await this.getEmailConfig(userId);
        return config !== null && !!config.smtp_host && !!config.smtp_user && !!config.smtp_password;
      }
    } catch (error) {
      console.error(`Erro ao testar configuração ${serviceType}:`, error);
      return false;
    }
  }
}