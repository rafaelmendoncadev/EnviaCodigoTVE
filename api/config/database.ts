import dotenv from 'dotenv';

dotenv.config();

// Verificar se é SQLite ou PostgreSQL
const isUsingSQLite = process.env.DATABASE_URL?.startsWith('sqlite:') || 
                     process.env.DATABASE_URL?.includes('username:password@host');

// Função para criar tabelas SQLite conforme especificação técnica
const createSQLiteTables = async () => {
  const Database = (await import('better-sqlite3')).default;
  const db = new Database('./dev.db');
  
  try {
    // Verificar se as tabelas já existem no formato novo
    const tablesQuery = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='history_items'");
    const hasNewSchema = tablesQuery.get();
    
    if (hasNewSchema) {
      console.log('✅ Schema atualizado já existe');
      db.close();
      return;
    }
    
    // Função auxiliar para verificar se coluna existe
    const columnExists = (tableName: string, columnName: string): boolean => {
      try {
        const info = db.prepare(`PRAGMA table_info(${tableName})`).all();
        return info.some((col: any) => col.name === columnName);
      } catch {
        return false;
      }
    };
    
    // Criar tabelas conforme especificação técnica com migração incremental
    db.exec(`PRAGMA foreign_keys = OFF;`);
    
    // Tabela Users (criar se não existir)
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Adicionar coluna uuid_id se não existir
    if (!columnExists('users', 'uuid_id')) {
      db.exec(`ALTER TABLE users ADD COLUMN uuid_id TEXT;`);
    }
    
    // Gerar UUIDs para registros que não têm
    db.exec(`
      UPDATE users SET uuid_id = lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr(hex(randomblob(2)),2) || '-' || substr('AB89',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))) WHERE uuid_id IS NULL;
    `);
    
    // Upload Sessions
    db.exec(`
      CREATE TABLE IF NOT EXISTS upload_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        total_codes INTEGER DEFAULT 0,
        valid_codes INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(uuid_id) ON DELETE CASCADE
      );
    `);

    // Codes
    db.exec(`
      CREATE TABLE IF NOT EXISTS codes (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        column_a_value TEXT,
        column_d_value TEXT,
        combined_code TEXT NOT NULL,
        row_number INTEGER NOT NULL,
        status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sent', 'archived')),
        sent_at DATETIME,
        archived_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES upload_sessions(id) ON DELETE CASCADE
      );
    `);
    
    // History Items (nova tabela)
    db.exec(`
      CREATE TABLE IF NOT EXISTS history_items (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        code_id TEXT,
        action_type TEXT NOT NULL CHECK (action_type IN ('send_whatsapp', 'send_email', 'archive', 'unarchive')),
        destination TEXT,
        status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(uuid_id) ON DELETE CASCADE,
        FOREIGN KEY (code_id) REFERENCES codes(id) ON DELETE SET NULL
      );
    `);
    
    // API Settings (nova tabela)
    db.exec(`
      CREATE TABLE IF NOT EXISTS api_settings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        service_type TEXT NOT NULL CHECK (service_type IN ('whatsapp', 'email')),
        encrypted_config TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        last_tested DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, service_type),
        FOREIGN KEY (user_id) REFERENCES users(uuid_id) ON DELETE CASCADE
      );
    `);
    
    // Manter settings para compatibilidade temporária
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        whatsapp_token TEXT,
        whatsapp_phone TEXT,
        email_host TEXT,
        email_port INTEGER,
        email_user TEXT,
        email_pass TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    
    // Criar índices
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_upload_sessions_user_id ON upload_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_upload_sessions_created_at ON upload_sessions(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_codes_session_id ON codes(session_id);
      CREATE INDEX IF NOT EXISTS idx_codes_status ON codes(status);
      CREATE INDEX IF NOT EXISTS idx_codes_created_at ON codes(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_history_user_id ON history_items(user_id);
      CREATE INDEX IF NOT EXISTS idx_history_created_at ON history_items(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_history_action_type ON history_items(action_type);
      CREATE INDEX IF NOT EXISTS idx_api_settings_user_service ON api_settings(user_id, service_type);
    `);
    
    db.exec(`PRAGMA foreign_keys = ON;`);
    
    // Inserir usuário de teste se não existir
    db.exec(`
      INSERT OR IGNORE INTO users (email, password_hash, name, uuid_id) 
      VALUES ('teste@exemplo.com', '$2b$12$L1HyTCykNnwufZQJ8Yb39OGb0VUTprvJM.L8b5.0uD0z2STa34Wi6', 'Usuário Teste', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    `);
    
    console.log('✅ Banco SQLite atualizado conforme especificação técnica');
    
  } catch (error) {
    console.error('❌ Erro ao atualizar schema SQLite:', error);
    throw error;
  } finally {
    db.close();
  }
};

// Função para inicializar o banco de dados
const initializeDatabase = async () => {
  if (isUsingSQLite) {
    // Configurar SQLite para desenvolvimento
    await createSQLiteTables();
    
    // Mock do pool para compatibilidade
    const pool = {
      query: async (text: string, params?: any[]) => {
        const Database = (await import('better-sqlite3')).default;
        const db = new Database('./dev.db');
        
        try {
          if (text.toLowerCase().includes('select')) {
            const transformedText = text.replace(/\$\d+/g, '?');
            const stmt = db.prepare(transformedText);
            const rows = stmt.all(params || []);
            db.close();
            return { rows };
          } else {
            const transformedText = text.replace(/\$\d+/g, '?');
            const stmt = db.prepare(transformedText);
            const result = stmt.run(params || []);
            db.close();
            return { rows: [], rowCount: result.changes };
          }
        } catch (error) {
          db.close();
          throw error;
        }
      },
      end: () => Promise.resolve()
    };
    
    console.log('✅ Usando SQLite para desenvolvimento');
    return pool;
  } else {
    // Importar pg apenas quando necessário
    const { Pool } = (await import('pg'));
    
    // Configurar PostgreSQL para produção
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // Test connection
    pool.on('connect', () => {
      console.log('✅ Conectado ao banco Neon PostgreSQL');
    });
    
    pool.on('error', (err: any) => {
      console.error('❌ Erro na conexão com o banco:', err);
    });
    
    return pool;
  }
};

// Inicializar e exportar o pool
const pool = await initializeDatabase();

export default pool;