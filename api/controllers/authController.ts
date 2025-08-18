import { Request, Response } from 'express';
import authService from '../services/authService.js';
import { LoginRequest, RegisterRequest } from '../models/types.js';
import { AuthRequest } from '../middleware/auth.js';

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: LoginRequest = req.body;
      const result = await authService.login(loginData);
      
      const statusCode = result.success ? 200 : 401;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error('Erro no controller de login:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const registerData: RegisterRequest = req.body;
      const result = await authService.register(registerData);
      
      const statusCode = result.success ? 201 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error('Erro no controller de registro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async profile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        user: req.user
      });
    } catch (error) {
      console.error('Erro no controller de perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async validateToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Token inválido'
        });
        return;
      }

      res.status(200).json({
        success: true,
        valid: true,
        user: req.user
      });
    } catch (error) {
      console.error('Erro na validação do token:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

export default new AuthController();