export interface User {
  id: string;
  uuid_id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Code {
  id: string;
  session_id: string;
  combined_code: string;
  column_a_value: string | null;
  column_d_value: string | null;
  row_number: number;
  status: 'available' | 'sent' | 'archived';
  sent_at: string | null;
  archived_at: string | null;
  created_at: string;
  filename?: string; // Nome da planilha de origem
  session_created_at?: string; // Data de criação da sessão
}

export interface UploadSession {
  id: string;
  user_id: string;
  filename: string;
  total_codes: number;
  available_codes: number;
  sent_codes: number;
  archived_codes: number;
  created_at: string;
}

export interface WhatsAppConfig {
  access_token: string;
  phone_number_id: string;
  webhook_url?: string;
}

export interface EmailConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface UploadResponse {
  session: UploadSession;
  codes: Code[];
}

export interface SendRequest {
  codeIds: string[];
  recipient: string;
}

export interface ArchiveRequest {
  codeIds: string[];
}

export interface ConfigTestResponse {
  success: boolean;
  message: string;
}

export interface Statistics {
  total_actions: number;
  whatsapp_sent: number;
  email_sent: number;
  archived_codes: number;
  total_sessions: number;
  total_codes: number;
  total_sent: number;
  total_archived: number;
  recent_activity: {
    id: string;
    action_type: string;
    destination?: string;
    status: string;
    created_at: string;
    date: string;
    sessions: number;
    codes_processed: number;
    codes_sent: number;
  }[];
}

export interface HistoryItem {
  id: string;
  user_id: string;
  code_id?: string;
  action_type: 'send_whatsapp' | 'send_email' | 'archive' | 'unarchive';
  destination?: string;
  status: 'success' | 'failed' | 'pending';
  details?: string;
  created_at: string;
}

export interface HistoryResponse {
  history: HistoryItem[];
  statistics: Statistics;
  pagination: {
    page: number;
    limit: number;
    offset: number;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}