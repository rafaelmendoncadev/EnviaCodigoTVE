import pool from '../config/database.js';
import { HistoryItem } from '../models/types.js';

export class HistoryRepository {
  
  static async create(historyItem: Omit<HistoryItem, 'id' | 'created_at'>): Promise<HistoryItem> {
    const id = this.generateUUID();
    const query = `
      INSERT INTO history_items (id, user_id, code_id, action_type, destination, status, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      id,
      historyItem.user_id,
      historyItem.code_id,
      historyItem.action_type,
      historyItem.destination,
      historyItem.status,
      historyItem.details
    ]);
    
    return result.rows[0];
  }
  
  static async findByUserId(userId: string, limit: number = 50, offset: number = 0): Promise<HistoryItem[]> {
    const query = `
      SELECT * FROM history_items 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }
  
  static async findByCodeId(codeId: string): Promise<HistoryItem[]> {
    const query = `
      SELECT * FROM history_items 
      WHERE code_id = ? 
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [codeId]);
    return result.rows;
  }
  
  static async getStatistics(userId: string): Promise<{
    total_actions: number;
    whatsapp_sent: number;
    email_sent: number;
    archived_codes: number;
    recent_activity: HistoryItem[];
  }> {
    // Total de ações
    const totalQuery = `SELECT COUNT(*) as total FROM history_items WHERE user_id = ?`;
    const totalResult = await pool.query(totalQuery, [userId]);
    
    // WhatsApp enviados
    const whatsappQuery = `SELECT COUNT(*) as count FROM history_items WHERE user_id = ? AND action_type = 'send_whatsapp' AND status = 'success'`;
    const whatsappResult = await pool.query(whatsappQuery, [userId]);
    
    // Emails enviados
    const emailQuery = `SELECT COUNT(*) as count FROM history_items WHERE user_id = ? AND action_type = 'send_email' AND status = 'success'`;
    const emailResult = await pool.query(emailQuery, [userId]);
    
    // Códigos arquivados
    const archivedQuery = `SELECT COUNT(*) as count FROM history_items WHERE user_id = ? AND action_type = 'archive' AND status = 'success'`;
    const archivedResult = await pool.query(archivedQuery, [userId]);
    
    // Atividade recente (últimos 10)
    const recentQuery = `SELECT * FROM history_items WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`;
    const recentResult = await pool.query(recentQuery, [userId]);
    
    return {
      total_actions: totalResult.rows[0].total,
      whatsapp_sent: whatsappResult.rows[0].count,
      email_sent: emailResult.rows[0].count,
      archived_codes: archivedResult.rows[0].count,
      recent_activity: recentResult.rows
    };
  }
  
  static async updateStatus(id: string, status: 'success' | 'failed' | 'pending', details?: string): Promise<void> {
    const query = `
      UPDATE history_items 
      SET status = ?, details = ?
      WHERE id = ?
    `;
    
    await pool.query(query, [status, details, id]);
  }
  
  private static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}