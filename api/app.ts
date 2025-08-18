/**
 * This is a API server
 */

import express, { type Request, type Response, type NextFunction }  from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import sendRoutes from './routes/send.js';
import settingsRoutes from './routes/settings.js';
import archiveRoutes from './routes/archive.js';
import codesRoutes from './routes/codes.js';
import historyRoutes from './routes/history.js';
import tutorialRoutes from './routes/tutorials.js';
import webhookRoutes from './routes/webhooks.js';
import connectivityRoutes from './routes/connectivity.js';

// for esm mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load env
dotenv.config();

// Configurar variáveis de ambiente padrão para desenvolvimento
// Se DATABASE_URL não estiver configurado ou for inválido, usar SQLite
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('username:password@host')) {
  process.env.DATABASE_URL = 'sqlite:./dev.db';
  console.log('🔄 Usando SQLite para desenvolvimento (DATABASE_URL não configurado)');
}

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'dev-secret-key-change-in-production';
}

const app: express.Application = express();

// Middleware de CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/codes', codesRoutes);
app.use('/api/send', sendRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/archive', archiveRoutes);
app.use('/api/history', historyRoutes);

// Fase 4 Integration Agent Routes
app.use('/api/tutorials', tutorialRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/connectivity', connectivityRoutes);

/**
 * health
 */
app.use('/api/health', (req: Request, res: Response, next: NextFunction): void => {
  res.status(200).json({
    success: true,
    message: 'ok'
  });
});

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error'
  });
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found'
  });
});

export default app;