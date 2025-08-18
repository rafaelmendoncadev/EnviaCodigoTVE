import pool from '../config/database.js';
import { ApiSettings, WhatsAppConfig, EmailConfig } from '../models/types.js';
import crypto from 'crypto';

export class ApiSettingsRepository {
  
  private static readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
  private static readonly ALGORITHM = 'aes-256-cbc';
  
  static async createOrUpdate(userId: string, serviceType: 'whatsapp' | 'email', config: WhatsAppConfig | EmailConfig): Promise<ApiSettings> {
    const id = this.generateUUID();
    const encryptedConfig = this.encrypt(JSON.stringify(config));
    
    // Verificar se já existe
    const existingQuery = `SELECT id FROM api_settings WHERE user_id = ? AND service_type = ?`;
    const existing = await pool.query(existingQuery, [userId, serviceType]);
    
    if (existing.rows.length > 0) {
      // Atualizar existente
      const updateQuery = `
        UPDATE api_settings 
        SET encrypted_config = ?, updated_at = CURRENT_TIMESTAMP, is_active = true
        WHERE user_id = ? AND service_type = ?
      `;
      
      await pool.query(updateQuery, [encryptedConfig, userId, serviceType]);
      
      // Buscar o registro atualizado
      const selectQuery = `SELECT * FROM api_settings WHERE user_id = ? AND service_type = ?`;
      const result = await pool.query(selectQuery, [userId, serviceType]);
      return result.rows[0];
    } else {
      // Criar novo
      const insertQuery = `
        INSERT INTO api_settings (id, user_id, service_type, encrypted_config, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
      
      await pool.query(insertQuery, [id, userId, serviceType, encryptedConfig]);
      
      // Buscar o registro criado
      const selectQuery = `SELECT * FROM api_settings WHERE id = ?`;
      const result = await pool.query(selectQuery, [id]);
      return result.rows[0];
    }
  }
  
  static async findByUserAndService(userId: string, serviceType: 'whatsapp' | 'email'): Promise<ApiSettings | null> {
    const query = `
      SELECT * FROM api_settings 
      WHERE user_id = ? AND service_type = ? AND is_active = true
    `;
    
    const result = await pool.query(query, [userId, serviceType]);
    return result.rows[0] || null;
  }
  
  static async getDecryptedConfig(userId: string, serviceType: 'whatsapp' | 'email'): Promise<WhatsAppConfig | EmailConfig | null> {
    const settings = await this.findByUserAndService(userId, serviceType);
    if (!settings) return null;
    
    try {
      const decryptedConfig = this.decrypt(settings.encrypted_config);
      return JSON.parse(decryptedConfig);
    } catch (error) {
      console.error('Erro ao descriptografar configuração:', error);
      return null;
    }
  }
  
  static async updateLastTested(userId: string, serviceType: 'whatsapp' | 'email'): Promise<void> {
    const query = `
      UPDATE api_settings 
      SET last_tested = CURRENT_TIMESTAMP
      WHERE user_id = ? AND service_type = ?
    `;
    
    await pool.query(query, [userId, serviceType]);
  }
  
  static async deactivate(userId: string, serviceType: 'whatsapp' | 'email'): Promise<void> {
    const query = `
      UPDATE api_settings 
      SET is_active = false
      WHERE user_id = ? AND service_type = ?
    `;
    
    await pool.query(query, [userId, serviceType]);
  }
  
  static async findAllByUser(userId: string): Promise<ApiSettings[]> {
    const query = `
      SELECT * FROM api_settings 
      WHERE user_id = ? AND is_active = true
      ORDER BY service_type
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }
  
  private static encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }
  
  private static decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
  
  private static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}