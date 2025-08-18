import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/types.js';

export interface AuthRequest extends Request {
  user?: Omit<User, 'password_hash'>;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ 
      success: false, 
      message: 'Token de acesso requerido' 
    });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET não configurado');
    res.status(500).json({ 
      success: false, 
      message: 'Erro de configuração do servidor' 
    });
    return;
  }

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      res.status(403).json({ 
        success: false, 
        message: 'Token inválido ou expirado' 
      });
      return;
    }

    req.user = decoded as Omit<User, 'password_hash'>;
    next();
  });
};

export const generateToken = (user: Omit<User, 'password_hash'>): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET não configurado');
  }

  return jwt.sign(
    { 
      id: user.id,
      uuid_id: user.uuid_id, 
      email: user.email, 
      name: user.name 
    },
    jwtSecret,
    { expiresIn: '24h' }
  );
};