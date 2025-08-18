-- Script de inicialização do banco de dados Neon PostgreSQL
-- Sistema de Extração de Códigos de Recarga

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de sessões de upload
CREATE TABLE IF NOT EXISTS upload_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    total_codes INTEGER NOT NULL DEFAULT 0,
    valid_codes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de códigos extraídos
CREATE TABLE IF NOT EXISTS codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES upload_sessions(id) ON DELETE CASCADE,
    column_a_value TEXT,
    column_d_value TEXT,
    combined_code TEXT NOT NULL,
    row_number INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sent', 'archived')),
    sent_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de histórico de ações
CREATE TABLE IF NOT EXISTS history_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_id UUID REFERENCES codes(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('send_whatsapp', 'send_email', 'archive', 'unarchive')),
    destination TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('success', 'failed', 'pending')),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações de APIs
CREATE TABLE IF NOT EXISTS api_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('whatsapp', 'email')),
    encrypted_config TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_tested TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, service_type)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_upload_sessions_user_id ON upload_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_created_at ON upload_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_codes_session_id ON codes(session_id);
CREATE INDEX IF NOT EXISTS idx_codes_status ON codes(status);
CREATE INDEX IF NOT EXISTS idx_codes_created_at ON codes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_history_items_user_id ON history_items(user_id);
CREATE INDEX IF NOT EXISTS idx_history_items_code_id ON history_items(code_id);
CREATE INDEX IF NOT EXISTS idx_history_items_created_at ON history_items(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_settings_user_id ON api_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_api_settings_service_type ON api_settings(service_type);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_settings_updated_at BEFORE UPDATE ON api_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir usuário de teste (opcional - remover em produção)
-- Email: teste@exemplo.com | Senha: teste123
INSERT INTO users (email, password_hash, name) 
VALUES (
    'teste@exemplo.com', 
    '$2b$12$K8gDKVkzOxF5qW.9VpdB2ue7wHZpS6/rLTD.hBdHXx9M3f2cjHi.C', 
    'Usuário Teste'
) ON CONFLICT (email) DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE users IS 'Tabela de usuários do sistema';
COMMENT ON TABLE upload_sessions IS 'Sessões de upload de arquivos Excel';
COMMENT ON TABLE codes IS 'Códigos extraídos dos arquivos Excel';
COMMENT ON TABLE history_items IS 'Histórico de ações realizadas no sistema';
COMMENT ON TABLE api_settings IS 'Configurações de APIs (WhatsApp e Email) criptografadas';

COMMENT ON COLUMN codes.status IS 'Status do código: available (disponível), sent (enviado), archived (arquivado)';
COMMENT ON COLUMN api_settings.encrypted_config IS 'Configurações da API criptografadas usando pgcrypto';