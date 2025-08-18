-- Migração SQLite para Schema conforme Especificação Técnica
-- Data: 2025-08-17
-- Backup recomendado antes da execução

PRAGMA foreign_keys = OFF;

-- Backup das tabelas atuais
CREATE TABLE users_backup AS SELECT * FROM users;
CREATE TABLE upload_sessions_backup AS SELECT * FROM upload_sessions;
CREATE TABLE codes_backup AS SELECT * FROM codes;
CREATE TABLE settings_backup AS SELECT * FROM settings;

-- ====================
-- 1. ATUALIZAR TABELA USERS
-- ====================
-- Adicionar campos UUID (mantendo compatibilidade)
ALTER TABLE users ADD COLUMN uuid_id TEXT UNIQUE;

-- Gerar UUIDs para registros existentes
UPDATE users SET uuid_id = lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr(hex(randomblob(2)),2) || '-' || substr('AB89',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))) WHERE uuid_id IS NULL;

-- ====================
-- 2. RECRIAR UPLOAD_SESSIONS
-- ====================
DROP TABLE IF EXISTS upload_sessions_new;
CREATE TABLE upload_sessions_new (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    total_codes INTEGER DEFAULT 0,
    valid_codes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(uuid_id) ON DELETE CASCADE
);

-- Migrar dados existentes
INSERT INTO upload_sessions_new (id, user_id, filename, total_codes, valid_codes, created_at)
SELECT 
    us.id,
    u.uuid_id,
    us.filename,
    0 as total_codes,
    0 as valid_codes,
    us.created_at
FROM upload_sessions us
JOIN users u ON us.user_id = u.id;

-- ====================
-- 3. RECRIAR CODES
-- ====================
DROP TABLE IF EXISTS codes_new;
CREATE TABLE codes_new (
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
    FOREIGN KEY (session_id) REFERENCES upload_sessions_new(id) ON DELETE CASCADE
);

-- Migrar dados existentes (assumindo format básico)
INSERT INTO codes_new (id, session_id, combined_code, row_number, status, created_at)
SELECT 
    lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr(hex(randomblob(2)),2) || '-' || substr('AB89',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))),
    upload_session_id,
    code,
    ROW_NUMBER() OVER (PARTITION BY upload_session_id ORDER BY created_at),
    status,
    created_at
FROM codes;

-- ====================
-- 4. CRIAR HISTORY_ITEMS
-- ====================
CREATE TABLE history_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    code_id TEXT,
    action_type TEXT NOT NULL CHECK (action_type IN ('send_whatsapp', 'send_email', 'archive', 'unarchive')),
    destination TEXT,
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(uuid_id) ON DELETE CASCADE,
    FOREIGN KEY (code_id) REFERENCES codes_new(id) ON DELETE SET NULL
);

-- ====================
-- 5. CRIAR API_SETTINGS
-- ====================
CREATE TABLE api_settings (
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

-- Migrar configurações existentes (placeholder - requer criptografia)
-- INSERT INTO api_settings será feito no código com criptografia adequada

-- ====================
-- 6. SUBSTITUIR TABELAS
-- ====================
DROP TABLE upload_sessions;
ALTER TABLE upload_sessions_new RENAME TO upload_sessions;

DROP TABLE codes;
ALTER TABLE codes_new RENAME TO codes;

-- Manter settings antiga temporariamente para migração manual
-- DROP TABLE settings; -- Será removida após migração das configurações

-- ====================
-- 7. CRIAR ÍNDICES
-- ====================
CREATE INDEX idx_users_uuid ON users(uuid_id);
CREATE INDEX idx_users_email ON users(email);

CREATE INDEX idx_upload_sessions_user_id ON upload_sessions(user_id);
CREATE INDEX idx_upload_sessions_created_at ON upload_sessions(created_at DESC);

CREATE INDEX idx_codes_session_id ON codes(session_id);
CREATE INDEX idx_codes_status ON codes(status);
CREATE INDEX idx_codes_created_at ON codes(created_at DESC);

CREATE INDEX idx_history_user_id ON history_items(user_id);
CREATE INDEX idx_history_created_at ON history_items(created_at DESC);
CREATE INDEX idx_history_action_type ON history_items(action_type);

CREATE INDEX idx_api_settings_user_service ON api_settings(user_id, service_type);

-- ====================
-- 8. DADOS DE EXEMPLO
-- ====================
-- Atualizar usuário de teste com UUID
UPDATE users SET uuid_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' WHERE email = 'teste@exemplo.com';

PRAGMA foreign_keys = ON;

-- Verificação de integridade
PRAGMA integrity_check;

-- Estatísticas pós-migração
SELECT 'users' as tabela, COUNT(*) as registros FROM users
UNION ALL
SELECT 'upload_sessions', COUNT(*) FROM upload_sessions
UNION ALL
SELECT 'codes', COUNT(*) FROM codes
UNION ALL
SELECT 'history_items', COUNT(*) FROM history_items
UNION ALL
SELECT 'api_settings', COUNT(*) FROM api_settings;