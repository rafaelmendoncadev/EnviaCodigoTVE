import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { Pool } from 'pg';

dotenv.config();

const app = express();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Auth middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token de acesso requerido' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }
};

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos Excel são permitidos'));
    }
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes (public)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !await bcrypt.compare(password, user.password_hash)) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
      token
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios'
      });
    }

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email já está em uso'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashedPassword, name]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      user,
      token
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Upload routes (protected)
app.post('/api/upload/excel', authenticateToken, upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo foi enviado'
      });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Process data starting from row 3 (index 2)
    const codes = [];
    for (let i = 2; i < data.length; i++) {
      const row = data[i] as any[];
      if (row[0] || row[3]) { // Column A or D has data
        const columnA = row[0] ? String(row[0]).trim() : null;
        const columnD = row[3] ? String(row[3]).trim() : null;
        const combinedCode = [columnA, columnD].filter(Boolean).join(' - ');
        
        if (combinedCode) {
          codes.push({
            column_a_value: columnA,
            column_d_value: columnD,
            combined_code: combinedCode,
            row_number: i + 1
          });
        }
      }
    }

    // Create upload session
    const sessionResult = await pool.query(
      'INSERT INTO upload_sessions (user_id, filename, total_codes) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, req.file.originalname, codes.length]
    );
    const session = sessionResult.rows[0];

    // Insert codes
    const insertedCodes = [];
    for (const codeData of codes) {
      const codeResult = await pool.query(
        'INSERT INTO codes (session_id, column_a_value, column_d_value, combined_code, row_number) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [session.id, codeData.column_a_value, codeData.column_d_value, codeData.combined_code, codeData.row_number]
      );
      insertedCodes.push(codeResult.rows[0]);
    }

    res.json({
      success: true,
      session: {
        id: session.id,
        filename: session.filename,
        total_codes: session.total_codes,
        created_at: session.created_at
      },
      codes: insertedCodes
    });
  } catch (error) {
    console.error('Erro ao processar arquivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar arquivo Excel'
    });
  }
});

app.get('/api/upload/sessions', authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM upload_sessions WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ sessions: result.rows });
  } catch (error) {
    console.error('Erro ao buscar sessões:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Get available codes for current user
app.get('/api/codes/available', authenticateToken, async (req: any, res) => {
  try {
    // Get all available codes from all sessions for the user
    const result = await pool.query(
      `SELECT c.*, us.filename, us.created_at as session_created_at
       FROM codes c 
       JOIN upload_sessions us ON c.session_id = us.id 
       WHERE us.user_id = $1 AND c.status = 'available' 
       ORDER BY us.created_at DESC, c.created_at DESC`,
      [req.user.id]
    );
    
    // Get the most recent session info
    const sessionResult = await pool.query(
      'SELECT * FROM upload_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );
    
    res.json({ 
      codes: result.rows,
      session: sessionResult.rows[0] || null
    });
  } catch (error) {
    console.error('Erro ao buscar códigos disponíveis:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Send routes
app.post('/api/send/whatsapp', authenticateToken, async (req: any, res) => {
  try {
    const { codeIds, phoneNumber, customMessage } = req.body;
    
    if (!codeIds || !Array.isArray(codeIds) || codeIds.length === 0) {
      return res.status(400).json({ error: 'IDs dos códigos são obrigatórios' });
    }

    // Update codes status to sent
    await pool.query(
      'UPDATE codes SET status = $1, sent_at = CURRENT_TIMESTAMP WHERE id = ANY($2)',
      ['sent', codeIds]
    );

    // Log send history
    await pool.query(
      'INSERT INTO send_history (user_id, action_type, destination, codes_count) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'send_whatsapp', phoneNumber, codeIds.length]
    );

    res.json({
      success: true,
      message: `${codeIds.length} códigos enviados via WhatsApp`
    });
  } catch (error) {
    console.error('Erro ao enviar via WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar códigos'
    });
  }
});

app.post('/api/send/email', authenticateToken, async (req: any, res) => {
  try {
    const { codeIds, email, customMessage } = req.body;
    
    if (!codeIds || !Array.isArray(codeIds) || codeIds.length === 0) {
      return res.status(400).json({ error: 'IDs dos códigos são obrigatórios' });
    }

    // Update codes status to sent
    await pool.query(
      'UPDATE codes SET status = $1, sent_at = CURRENT_TIMESTAMP WHERE id = ANY($2)',
      ['sent', codeIds]
    );

    // Log send history
    await pool.query(
      'INSERT INTO send_history (user_id, action_type, destination, codes_count) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'send_email', email, codeIds.length]
    );

    res.json({
      success: true,
      message: `${codeIds.length} códigos enviados via email`
    });
  } catch (error) {
    console.error('Erro ao enviar via email:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar códigos'
    });
  }
});

// Archive routes
app.post('/api/archive/codes', authenticateToken, async (req: any, res) => {
  try {
    const { codeIds } = req.body;
    
    if (!codeIds || !Array.isArray(codeIds) || codeIds.length === 0) {
      return res.status(400).json({ error: 'IDs dos códigos são obrigatórios' });
    }

    await pool.query(
      'UPDATE codes SET status = $1, archived_at = CURRENT_TIMESTAMP WHERE id = ANY($2)',
      ['archived', codeIds]
    );

    res.json({
      success: true,
      message: `${codeIds.length} códigos arquivados`
    });
  } catch (error) {
    console.error('Erro ao arquivar códigos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao arquivar códigos'
    });
  }
});

app.get('/api/archive/codes', authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query(
      'SELECT c.*, us.filename FROM codes c JOIN upload_sessions us ON c.session_id = us.id WHERE c.status = $1 AND us.user_id = $2 ORDER BY c.archived_at DESC',
      ['archived', req.user.id]
    );
    res.json({ codes: result.rows });
  } catch (error) {
    console.error('Erro ao buscar códigos arquivados:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// History routes
app.get('/api/history', authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM send_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json({ history: result.rows });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

app.get('/api/history/statistics', authenticateToken, async (req: any, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(DISTINCT us.id) as total_sessions,
        COUNT(c.id) as total_codes,
        COUNT(CASE WHEN c.status = 'sent' THEN 1 END) as total_sent,
        COUNT(CASE WHEN c.status = 'archived' THEN 1 END) as total_archived
      FROM upload_sessions us
      LEFT JOIN codes c ON us.id = c.session_id
      WHERE us.user_id = $1
    `, [req.user.id]);
    
    res.json({ statistics: stats.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Settings routes
app.get('/api/settings/whatsapp', authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query(
      'SELECT config_data FROM api_settings WHERE user_id = $1 AND service_type = $2',
      [req.user.id, 'whatsapp']
    );
    
    res.json({
      success: true,
      config: result.rows[0]?.config_data || {}
    });
  } catch (error) {
    console.error('Erro ao buscar configurações WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

app.post('/api/settings/whatsapp', authenticateToken, async (req: any, res) => {
  try {
    const { config } = req.body;
    
    await pool.query(`
      INSERT INTO api_settings (user_id, service_type, config_data)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, service_type)
      DO UPDATE SET config_data = $3, updated_at = CURRENT_TIMESTAMP
    `, [req.user.id, 'whatsapp', JSON.stringify(config)]);
    
    res.json({
      success: true,
      message: 'Configurações WhatsApp salvas'
    });
  } catch (error) {
    console.error('Erro ao salvar configurações WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Codes routes
app.get('/api/codes/:sessionId', authenticateToken, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const { status } = req.query;
    
    let query = 'SELECT * FROM codes WHERE session_id = $1';
    const params = [sessionId];
    
    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }
    
    query += ' ORDER BY row_number ASC';
    
    const result = await pool.query(query, params);
    res.json({ codes: result.rows });
  } catch (error) {
    console.error('Erro ao buscar códigos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

app.patch('/api/codes/status', authenticateToken, async (req: any, res) => {
  try {
    const { codeIds, status } = req.body;
    
    if (!codeIds || !Array.isArray(codeIds) || !status) {
      return res.status(400).json({
        success: false,
        message: 'IDs dos códigos e status são obrigatórios'
      });
    }
    
    await pool.query(
      'UPDATE codes SET status = $1 WHERE id = ANY($2)',
      [status, codeIds]
    );
    
    res.json({
      success: true,
      message: 'Status dos códigos atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar status dos códigos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Error handling middleware
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

const PORT = process.env.PORT || 3002;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  });
}

export default app;