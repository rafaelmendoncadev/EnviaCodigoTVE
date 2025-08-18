# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Frontend Development:**
- `npm run client:dev` - Start Vite development server on port 5173
- `npm run build` - Build the React frontend for production  
- `npm run preview` - Preview production build locally

**Backend Development:**
- `npm run server:dev` - Start Node.js API server with nodemon on port 3002
- `npm run dev` - Start both frontend and backend concurrently

**Code Quality:**
- `npm run lint` - Run ESLint on TypeScript files
- `npm run check` - Run TypeScript compiler without emitting files

## Project Architecture

This is a full-stack application for managing and sending promotional codes via WhatsApp and email.

### Frontend (React + TypeScript + Vite)
- **Entry Point:** `src/main.tsx` renders the React app
- **Routing:** React Router with protected/public route components in `App.tsx`
- **Authentication:** Context-based auth system (`src/contexts/AuthContext.tsx`)
- **UI Components:** Custom components in `src/components/` built with Tailwind CSS
- **State Management:** Zustand for global state, React hooks for local state
- **API Integration:** Custom hooks in `src/hooks/` for API communication

### Backend (Express + TypeScript)
- **Entry Point:** `api/server.ts` starts the Express server
- **App Configuration:** `api/app.ts` sets up Express with middleware and routes
- **Database:** Dual-database setup supporting both SQLite (development) and PostgreSQL (production)
- **Authentication:** JWT-based auth with bcrypt password hashing
- **File Processing:** Excel/XLSX file upload and processing for promotional codes

### Database Strategy
- **Development:** SQLite with auto-initialization (`./dev.db`)
- **Production:** PostgreSQL via DATABASE_URL environment variable
- **Schema:** Users, upload sessions, codes, settings, and history tables
- **Migration:** Automatic table creation in SQLite, manual setup required for PostgreSQL

### API Structure
```
/api/auth     - User registration, login, token validation
/api/upload   - Excel file upload and code processing
/api/send     - Send codes via WhatsApp/email
/api/settings - Configure WhatsApp/email service credentials
/api/archive  - Archive used codes
/api/health   - Health check endpoint
```

### Key Features
- **Code Management:** Upload Excel files containing promotional codes
- **Multi-Channel Sending:** Send codes via WhatsApp API or email SMTP
- **Status Tracking:** Track code status (available, sent, archived)
- **Configuration:** Encrypted storage of API credentials and SMTP settings
- **Authentication:** Secure user registration and login system

### Development Environment Setup
1. The database auto-configures to SQLite if DATABASE_URL is not set
2. JWT_SECRET defaults to development key if not configured
3. CORS configured for localhost:5173 (Vite) and localhost:3000
4. File uploads limited to 10MB
5. Request logging enabled for debugging

### File Structure Patterns
- **API Controllers:** Handle HTTP requests and responses
- **Services:** Business logic and external API integration
- **Repositories:** Database access layer
- **Types:** Shared TypeScript interfaces between frontend and backend
- **Routes:** Express route definitions
- **Middleware:** Authentication and request processing

### Proxy Configuration
Vite is configured to proxy `/api/*` requests to `http://localhost:3002` during development, enabling seamless frontend-backend communication.