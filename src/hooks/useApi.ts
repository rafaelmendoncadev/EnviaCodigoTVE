import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  User,
  Code,
  UploadSession,
  WhatsAppConfig,
  EmailConfig,
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  SendRequest,
  ArchiveRequest,
  Statistics,
  HistoryResponse,
  PaginatedResponse
} from '../types';

const API_BASE_URL = '/api';

interface UseApiReturn {
  apiClient: {
    // Auth
    login: (data: LoginRequest) => Promise<{ user: User; token: string }>;
    register: (data: RegisterRequest) => Promise<{ user: User; token: string }>;
    
    // Upload
    uploadFile: (file: File) => Promise<{ session: UploadSession; codes: Code[] }>;
    getAvailableCodes: () => Promise<{ codes: Code[]; session: UploadSession | null }>;
    getSessionCodes: (sessionId: string, page?: number, limit?: number, status?: 'available' | 'sent' | 'archived') => Promise<PaginatedResponse<Code>>;
    getSessionDetails: (sessionId: string) => Promise<{ session: UploadSession; summary: any }>;
    
    // Send
    sendCodes: (data: SendRequest) => Promise<ApiResponse>;
    sendWhatsApp: (codeIds: string[], phoneNumber: string) => Promise<ApiResponse>;
    sendEmail: (codeIds: string[], email: string) => Promise<ApiResponse>;
    
    // Archive
    archiveCodes: (codeIds: string[]) => Promise<ApiResponse>;
    unarchiveCodes: (codeIds: string[]) => Promise<ApiResponse>;
    updateCodesStatus: (codeIds: string[], status: 'available' | 'sent' | 'archived') => Promise<ApiResponse>;
    getArchivedCodes: (page?: number, limit?: number) => Promise<{ codes: Code[]; total: number }>;
    restoreCodes: (codeIds: string[]) => Promise<ApiResponse>;
    
    // Settings
    getWhatsAppConfig: () => Promise<{ phone_number_id?: string; webhook_url?: string; is_active?: boolean; has_token?: boolean }>;
    saveWhatsAppConfig: (config: WhatsAppConfig) => Promise<ApiResponse>;
    saveEmailConfig: (config: EmailConfig) => Promise<ApiResponse>;
    testWhatsAppConnection: () => Promise<{ success: boolean; message?: string }>;
    testEmailConnection: (config: EmailConfig) => Promise<{ success: boolean; message?: string }>;
    
    // History & Statistics
    getHistory: (page?: number, limit?: number) => Promise<HistoryResponse>;
    getStatistics: () => Promise<Statistics>;
  };
  loading: boolean;
}

export const useApi = (): UseApiReturn => {
  const [loading, setLoading] = useState(false);
  const { token, logout } = useAuth();

  const makeRequest = useCallback(async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    setLoading(true);
    
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        (headers as Record<string, string>).Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        logout();
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  const makeFormDataRequest = useCallback(async <T>(
    endpoint: string,
    formData: FormData
  ): Promise<T> => {
    setLoading(true);
    
    try {
      const headers: HeadersInit = {};

      if (token) {
        (headers as Record<string, string>).Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (response.status === 401) {
        logout();
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  const apiClient = {
    // Auth
    login: (data: LoginRequest) => 
      makeRequest<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    register: (data: RegisterRequest) => 
      makeRequest<{ user: User; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // Upload
    uploadFile: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return makeFormDataRequest<{ session: UploadSession; codes: Code[] }>('/upload/excel', formData);
    },

    getAvailableCodes: () => 
      makeRequest<{ codes: Code[]; session: UploadSession | null }>('/codes/available'),

    getSessionCodes: (sessionId: string, page = 1, limit = 50, status?: 'available' | 'sent' | 'archived') => {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (status) params.append('status', status);
      return makeRequest<PaginatedResponse<Code>>(`/codes/${sessionId}?${params}`);
    },

    getSessionDetails: (sessionId: string) => 
      makeRequest<{ session: UploadSession; summary: any }>(`/upload/sessions/${sessionId}`),

    // Send
    sendCodes: (data: SendRequest) => 
      makeRequest<ApiResponse>('/send', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    sendWhatsApp: (codeIds: string[], phoneNumber: string) => 
      makeRequest<ApiResponse>('/send/whatsapp', {
        method: 'POST',
        body: JSON.stringify({ codeIds, phone_number: phoneNumber }),
      }),

    sendEmail: (codeIds: string[], email: string) => 
      makeRequest<ApiResponse>('/send/email', {
        method: 'POST',
        body: JSON.stringify({ codeIds, email }),
      }),

    // Archive
    archiveCodes: (codeIds: string[]) => 
      makeRequest<ApiResponse>('/archive/codes', {
        method: 'POST',
        body: JSON.stringify({ codeIds }),
      }),

    unarchiveCodes: (codeIds: string[]) => 
      makeRequest<ApiResponse>('/codes/unarchive', {
        method: 'POST',
        body: JSON.stringify({ code_ids: codeIds }),
      }),

    updateCodesStatus: (codeIds: string[], status: 'available' | 'sent' | 'archived') => 
      makeRequest<ApiResponse>('/codes/status', {
        method: 'PATCH',
        body: JSON.stringify({ codeIds, status }),
      }),

    // Settings
    getWhatsAppConfig: () => 
      makeRequest<{ phone_number_id?: string; webhook_url?: string; is_active?: boolean; has_token?: boolean }>('/settings/whatsapp'),

    saveWhatsAppConfig: (config: WhatsAppConfig) => 
      makeRequest<ApiResponse>('/settings/whatsapp', {
        method: 'POST',
        body: JSON.stringify(config),
      }),

    saveEmailConfig: (config: EmailConfig) => 
      makeRequest<ApiResponse>('/settings/email', {
        method: 'POST',
        body: JSON.stringify(config),
      }),

    testWhatsAppConnection: () => 
      makeRequest<{ success: boolean; message?: string }>('/settings/test/whatsapp', {
        method: 'POST',
      }),

    testEmailConnection: (config: EmailConfig) => 
      makeRequest<{ success: boolean; message?: string }>('/settings/test/email', {
        method: 'POST',
        body: JSON.stringify(config),
      }),

    // History & Statistics
    getHistory: (page = 1, limit = 50) => {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      return makeRequest<HistoryResponse>(`/history?${params}`);
    },

    getStatistics: () => 
      makeRequest<Statistics>('/history/statistics'),

    getArchivedCodes: (page = 1, limit = 50) => {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      return makeRequest<{ codes: Code[]; total: number }>(`/archive/codes?${params}`);
    },

    restoreCodes: (codeIds: string[]) => 
      makeRequest<ApiResponse>('/codes/status', {
        method: 'PATCH',
        body: JSON.stringify({ codeIds, status: 'available' }),
      }),
  };

  return {
    apiClient,
    loading,
  };
};