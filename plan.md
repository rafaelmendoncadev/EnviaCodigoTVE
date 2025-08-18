# Plano de Refatoração Completa - EnviaCodigo

## 🎯 **Objetivo**
Refatorar completamente o projeto para alinhar com os requisitos do produto e arquitetura técnica especificados nos documentos `.trae/documents/`.

## 📋 **Fases de Execução**

### **Fase 1: Database Agent - Atualização do Schema SQLite**
- Atualizar schema SQLite atual com campos conforme especificação
- Implementar todas as tabelas: users, upload_sessions, codes, history_items, api_settings
- Criar script de migração/atualização do schema atual
- Implementar índices e constraints adequados no SQLite
- Manter compatibilidade com sistema atual

### **Fase 2: Backend Agent - Refatoração da API**
- Restruturar rotas para alinhamento com especificação:
  - `POST /api/upload` (unificado)
  - `GET /api/codes/:session_id`
  - `POST /api/send/whatsapp` e `/api/send/email`
  - `POST /api/settings/whatsapp` e `/api/settings/email`
  - `POST /api/settings/test/*`
  - `GET /api/history`
- Implementar controllers, services e repositories atualizados
- Adicionar validações e tratamento de erros padronizados
- Implementar sistema de paginação para códigos

### **Fase 3: Frontend Agent - Reestruturação das Páginas**
- **Página Principal (/)**: Integrar upload + preview + grid de códigos
- **Página Configurações (/configuracoes)**: Adicionar tutoriais integrados e testes
- **Página Histórico (/historico)**: Implementar histórico completo com estatísticas
- Remover página `/upload` separada e integrar funcionalidade na principal
- Implementar design system conforme especificação (cores, fontes, componentes)

### **Fase 4: Integration Agent - Melhorias de Integração**
- Implementar sistema de tutoriais integrados para APIs
- Adicionar testes de conectividade automáticos
- Melhorar tratamento de erros e retry logic
- Implementar webhooks para WhatsApp se necessário

### **Fase 5: Quality Agent - Testes e Validação**
- Criar testes unitários para novas funcionalidades
- Testes de integração para APIs refatoradas
- Testes E2E para fluxo completo
- Validação de migração de dados

### **Fase 6: Documentation Agent - Atualização da Documentação**
- Atualizar CLAUDE.md com nova arquitetura
- Documentar APIs conforme nova especificação
- Criar guias de migração e deployment
- Atualizar documentação dos agentes

## 🗂️ **Arquivos Principais a Modificar**

### **Database (Prioridade Alta)**
- `api/config/database.ts` - Schema SQLite atualizado
- `api/config/migration.sql` - Script de migração/atualização SQLite
- Repositories atualizados para novo schema SQLite

### **Backend (Prioridade Alta)**  
- `api/routes/*.ts` - Todas as rotas conforme spec
- `api/controllers/*.ts` - Controllers atualizados
- `api/services/*.ts` - Business logic refatorada

### **Frontend (Prioridade Média)**
- `src/App.tsx` - Rotas atualizadas 
- `src/pages/Home.tsx` - Página principal integrada
- `src/pages/Settings.tsx` - Configurações com tutoriais
- `src/pages/History.tsx` - Nova página de histórico

### **Componentes (Prioridade Baixa)**
- Novos componentes para tutoriais
- Melhorias no CodeGrid com filtros avançados
- Componentes de estatísticas para histórico

## ⚡ **Estratégia de Migração**
1. **Backup** dos dados atuais SQLite
2. **Validação** do schema SQLite atualizado em ambiente de desenvolvimento
3. **Migração incremental** do schema com ALTER TABLE statements
4. **Testes extensivos** do schema atualizado
5. **Deploy sem downtime** mantendo SQLite como base

## 🎯 **Critérios de Sucesso**
- ✅ Schema SQLite atualizado conforme especificação funcional
- ✅ APIs alinhadas com documentação técnica
- ✅ Interface conforme requisitos do produto
- ✅ Funcionalidades de histórico e tutoriais implementadas
- ✅ Testes passando em todos os níveis
- ✅ Performance mantida ou melhorada

## ⏱️ **Estimativa de Tempo**
- **Fase 1-2 (Backend)**: 2-3 dias (simplificado com SQLite)
- **Fase 3 (Frontend)**: 2-3 dias  
- **Fase 4-6 (Integração/Testes)**: 1-2 dias
- **Total**: 5-8 dias de desenvolvimento

## 🚨 **Riscos e Mitigações**
- **Perda de dados**: Backup completo antes da migração
- **Downtime**: Deploy com feature flags e rollback
- **Incompatibilidade**: Testes extensivos em staging
- **Performance**: Monitoramento contínuo pós-deploy

## 🔍 **Principais Gaps Identificados**

### **1. Estrutura de Rotas (Frontend)**
- **Especificado:** `/`, `/configuracoes`, `/historico`, `/login`
- **Atual:** `/`, `/upload`, `/archive`, `/settings`, `/login`, `/register`
- **Gap:** Falta unificação da página principal com upload integrado

### **2. Estrutura de Banco de Dados**
- **Especificado:** Schema com UUIDs, campos específicos para histórico e configurações
- **Atual:** SQLite com estrutura básica, faltam tabelas history_items e api_settings
- **Gap:** Falta implementação de tabelas de histórico e configurações conforme especificação

### **3. APIs não Implementadas**
- **Especificado:** `/api/upload` (POST), `/api/codes/:session_id` (GET)
- **Atual:** `/api/upload/excel`, `/api/upload/sessions/:sessionId/codes`
- **Gap:** Estrutura de APIs não alinhada com especificação

### **4. Página Principal**
- **Especificado:** Upload + Preview + Grid de códigos em uma página
- **Atual:** Páginas separadas (Home dashboard + Upload)
- **Gap:** Falta integração conforme design especificado

### **5. Funcionalidades Faltantes**
- **Histórico completo** com estatísticas
- **Tutoriais integrados** nas configurações
- **Filtros avançados** por status
- **Sistema de paginação** adequado