import userRepository from '../repositories/userRepository.js';
import { generateToken } from '../middleware/auth.js';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../models/types.js';

export class AuthService {
  async login(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      const { email, password } = loginData;

      // Validação básica
      if (!email || !password) {
        return {
          success: false,
          message: 'Email e senha são obrigatórios'
        };
      }

      // Buscar usuário
      const user = await userRepository.findByEmail(email);
      if (!user) {
        return {
          success: false,
          message: 'Credenciais inválidas'
        };
      }

      // Verificar senha
      const isValidPassword = await userRepository.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return {
          success: false,
          message: 'Credenciais inválidas'
        };
      }

      // Atualizar último login
      await userRepository.updateLastLogin(user.id);

      // Gerar token
      const userWithoutPassword = {
        id: user.id,
        uuid_id: user.uuid_id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
        updated_at: user.updated_at
      };

      const token = generateToken(userWithoutPassword);

      return {
        success: true,
        token,
        user: userWithoutPassword,
        message: 'Login realizado com sucesso'
      };
    } catch (error) {
      console.error('Erro no serviço de login:', error);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  async register(registerData: RegisterRequest): Promise<AuthResponse> {
    try {
      const { email, password, name } = registerData;

      // Validação básica
      if (!email || !password || !name) {
        return {
          success: false,
          message: 'Todos os campos são obrigatórios'
        };
      }

      // Validar formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          message: 'Formato de email inválido'
        };
      }

      // Validar senha
      if (password.length < 6) {
        return {
          success: false,
          message: 'Senha deve ter pelo menos 6 caracteres'
        };
      }

      // Verificar se usuário já existe
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        return {
          success: false,
          message: 'Email já está em uso'
        };
      }

      // Criar usuário
      const user = await userRepository.create(email, password, name);

      // Gerar token
      const userWithoutPassword = {
        id: user.id,
        uuid_id: user.uuid_id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
        updated_at: user.updated_at
      };

      const token = generateToken(userWithoutPassword);

      return {
        success: true,
        token,
        user: userWithoutPassword,
        message: 'Usuário criado com sucesso'
      };
    } catch (error) {
      console.error('Erro no serviço de registro:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      };
    }
  }

  async validateToken(userId: string): Promise<User | null> {
    try {
      return await userRepository.findById(userId);
    } catch (error) {
      console.error('Erro ao validar token:', error);
      return null;
    }
  }
}

export default new AuthService();