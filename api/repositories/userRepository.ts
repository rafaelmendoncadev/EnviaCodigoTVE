import pool from '../config/database';
import { User } from '../models/types.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    try {
      // Verificar se pool está inicializado
      if (!pool) {
        throw new Error('Pool de conexão não inicializado');
      }
      
      // Usar sintaxe compatível com SQLite e PostgreSQL
      const isUsingSQLite = process.env.DATABASE_URL?.startsWith('sqlite:');
      const query = isUsingSQLite ? 'SELECT * FROM users WHERE email = ?' : 'SELECT * FROM users WHERE email = $1';
      const result = await pool.query(query, [email]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0] as User;
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const isUsingSQLite = process.env.DATABASE_URL?.startsWith('sqlite:');
      const query = isUsingSQLite ? 'SELECT * FROM users WHERE id = ?' : 'SELECT * FROM users WHERE id = $1';
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0] as User;
    } catch (error) {
      console.error('Erro ao buscar usuário por ID:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  async findByUuid(uuid_id: string): Promise<User | null> {
    try {
      const isUsingSQLite = process.env.DATABASE_URL?.startsWith('sqlite:');
      const query = isUsingSQLite ? 'SELECT * FROM users WHERE uuid_id = ?' : 'SELECT * FROM users WHERE uuid_id = $1';
      const result = await pool.query(query, [uuid_id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0] as User;
    } catch (error) {
      console.error('Erro ao buscar usuário por UUID:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  async create(email: string, password: string, name: string): Promise<User> {
    try {
      const uuid_id = uuidv4();
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(password, saltRounds);
      const isUsingSQLite = process.env.DATABASE_URL?.startsWith('sqlite:');
      
      let query: string;
      if (isUsingSQLite) {
        query = `INSERT INTO users (email, password_hash, name, uuid_id, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`;
        await pool.query(query, [email, password_hash, name, uuid_id]);
        // Para SQLite, buscar o usuário criado
        const selectQuery = 'SELECT * FROM users WHERE email = ?';
        const result = await pool.query(selectQuery, [email]);
        return result.rows[0] as User;
      } else {
        query = `
          INSERT INTO users (uuid_id, email, password_hash, name, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          RETURNING *
        `;
        const result = await pool.query(query, [uuid_id, email, password_hash, name]);
        return result.rows[0] as User;
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      if ((error as any).code === '23505' || (error as any).code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('Email já está em uso');
      }
      throw new Error('Erro interno do servidor');
    }
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Erro ao verificar senha:', error);
      return false;
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    try {
      const isUsingSQLite = process.env.DATABASE_URL?.startsWith('sqlite:');
      const query = isUsingSQLite 
        ? "UPDATE users SET created_at = datetime('now') WHERE id = ?"
        : 'UPDATE users SET updated_at = NOW() WHERE id = $1';
      await pool.query(query, [userId]);
    } catch (error) {
      console.error('Erro ao atualizar último login:', error);
      // Não lança erro pois não é crítico
    }
  }
}

export default new UserRepository();