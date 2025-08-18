import express from 'express';
import authController from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Rotas públicas
router.post('/login', authController.login);
router.post('/register', authController.register);

// Rotas protegidas
router.get('/profile', authenticateToken, authController.profile);
router.get('/validate', authenticateToken, authController.validateToken);

export default router;