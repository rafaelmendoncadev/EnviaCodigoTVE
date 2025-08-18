import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-32-chars-long-12345';
const IV_LENGTH = 16; // For AES, this is always 16

export class EncryptionUtil {
  static encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Erro ao criptografar:', error);
      throw new Error('Falha na criptografia');
    }
  }

  static decrypt(encryptedData: string): string {
    try {
      const textParts = encryptedData.split(':');
      const iv = Buffer.from(textParts.shift()!, 'hex');
      const encrypted = textParts.join(':');

      const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Erro ao descriptografar:', error);
      throw new Error('Falha na descriptografia');
    }
  }

  static encryptConfig(config: object): string {
    const configString = JSON.stringify(config);
    return this.encrypt(configString);
  }

  static decryptConfig<T>(encryptedConfig: string): T {
    const decryptedString = this.decrypt(encryptedConfig);
    return JSON.parse(decryptedString) as T;
  }

  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

export default EncryptionUtil;