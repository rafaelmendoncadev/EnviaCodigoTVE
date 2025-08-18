import pool from '../config/database.js';
import { UploadSession, Code } from '../models/types.js';
import { v4 as uuidv4 } from 'uuid';

export class UploadRepository {
  /**
   * Criar nova sessão de upload
   */
  static async createUploadSession(
    userId: string,
    filename: string,
    totalCodes: number = 0,
    validCodes: number = 0
  ): Promise<UploadSession> {
    const id = uuidv4();
    const query = `
      INSERT INTO upload_sessions (id, user_id, filename, total_codes, valid_codes)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    await pool.query(query, [id, userId, filename, totalCodes, validCodes]);
    
    // Buscar a sessão criada (compatível com SQLite)
    const selectQuery = 'SELECT * FROM upload_sessions WHERE id = ?';
    const result = await pool.query(selectQuery, [id]);
    return result.rows[0];
  }

  /**
   * Atualizar status da sessão de upload
   */
  static async updateUploadSessionStatus(
    sessionId: string,
    status: 'processing' | 'completed' | 'error',
    errorMessage?: string
  ): Promise<void> {
    const query = `
      UPDATE upload_sessions 
      SET status = $1, error_message = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `;
    
    await pool.query(query, [status, errorMessage || null, sessionId]);
  }

  /**
   * Buscar sessão de upload por ID
   */
  static async findUploadSessionById(sessionId: string): Promise<UploadSession | null> {
    const query = 'SELECT * FROM upload_sessions WHERE id = ?';
    const result = await pool.query(query, [sessionId]);
    return result.rows[0] || null;
  }

  /**
   * Buscar sessões de upload do usuário
   */
  static async findUploadSessionsByUser(
    userId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<UploadSession[]> {
    const query = `
      SELECT * FROM upload_sessions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  /**
   * Inserir códigos extraídos do Excel
   */
  static async insertCodes(sessionId: string, codes: Array<{
    column_a_value: string | null,
    column_d_value: string | null,
    combined_code: string,
    row_number: number
  }>): Promise<Code[]> {
    if (codes.length === 0) return [];

    const values: string[] = [];
    const params: any[] = [];
    const insertedIds: string[] = [];
    let paramIndex = 1;

    codes.forEach((codeData) => {
      const id = uuidv4();
      values.push(`(?, ?, ?, ?, ?, ?, 'available')`);
      params.push(id, sessionId, codeData.column_a_value, codeData.column_d_value, codeData.combined_code, codeData.row_number);
      insertedIds.push(id);
    });

    const query = `
      INSERT INTO codes (id, session_id, column_a_value, column_d_value, combined_code, row_number, status)
      VALUES ${values.join(', ')}
    `;

    await pool.query(query, params);
    
    // Buscar os códigos inseridos (compatível com SQLite)
    const placeholders = insertedIds.map(() => '?').join(', ');
    const selectQuery = `SELECT * FROM codes WHERE id IN (${placeholders}) ORDER BY created_at ASC`;
    const result = await pool.query(selectQuery, insertedIds);
    return result.rows;
  }

  /**
   * Buscar códigos por sessão de upload
   */
  static async findCodesBySession(
    sessionId: string,
    status?: 'available' | 'sent' | 'archived'
  ): Promise<Code[]> {
    let query = 'SELECT * FROM codes WHERE session_id = ?';
    const params = [sessionId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY row_number ASC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Atualizar status de códigos específicos
   */
  static async updateCodesStatus(
    codeIds: string[],
    status: 'available' | 'sent' | 'archived'
  ): Promise<void> {
    if (codeIds.length === 0) return;

    const placeholders = codeIds.map(() => '?').join(', ');
    const timestampField = status === 'sent' ? 'sent_at' : status === 'archived' ? 'archived_at' : null;
    
    let query = `UPDATE codes SET status = ?`;
    const params = [status];
    
    if (timestampField) {
      query += `, ${timestampField} = CURRENT_TIMESTAMP`;
    }
    
    query += ` WHERE id IN (${placeholders})`;
    params.push(...codeIds);

    await pool.query(query, params);
  }

  /**
   * Buscar códigos por IDs
   */
  static async findCodesByIds(codeIds: string[]): Promise<Code[]> {
    if (codeIds.length === 0) return [];

    const placeholders = codeIds.map(() => '?').join(', ');
    const query = `SELECT * FROM codes WHERE id IN (${placeholders})`;

    const result = await pool.query(query, codeIds);
    return result.rows;
  }

  /**
   * Buscar código por ID
   */
  static async findCodeById(codeId: string): Promise<Code | null> {
    const query = 'SELECT * FROM codes WHERE id = ?';
    const result = await pool.query(query, [codeId]);
    return result.rows[0] || null;
  }

  /**
   * Buscar sessão por ID (alias para findUploadSessionById)
   */
  static async findSessionById(sessionId: string): Promise<UploadSession | null> {
    return this.findUploadSessionById(sessionId);
  }

  /**
   * Contar códigos por status em uma sessão
   */
  static async countCodesByStatus(sessionId: string): Promise<{
    available: number;
    sent: number;
    archived: number;
    total: number;
  }> {
    const query = `
      SELECT 
        status,
        COUNT(*) as count
      FROM codes 
      WHERE session_id = ? 
      GROUP BY status
    `;

    const result = await pool.query(query, [sessionId]);
    
    const counts = {
      available: 0,
      sent: 0,
      archived: 0,
      total: 0
    };

    result.rows.forEach(row => {
      counts[row.status as keyof typeof counts] = parseInt(row.count);
      counts.total += parseInt(row.count);
    });

    return counts;
  }
}