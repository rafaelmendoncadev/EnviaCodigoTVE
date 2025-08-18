export interface User {
  id: string;
  uuid_id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface UploadSession {
  id: string;
  user_id: string;
  filename: string;
  total_codes: number;
  valid_codes: number;
  created_at: Date;
}

export interface Code {
  id: string;
  session_id: string;
  column_a_value: string | null;
  column_d_value: string | null;
  combined_code: string;
  row_number: number;
  status: 'available' | 'sent' | 'archived';
  sent_at: Date | null;
  archived_at: Date | null;
  created_at: Date;
}

export interface HistoryItem {
  id: string;
  user_id: string;
  code_id: string | null;
  action_type: 'send_whatsapp' | 'send_email' | 'archive' | 'unarchive';
  destination: string | null;
  status: 'success' | 'failed' | 'pending';
  details: string | null;
  created_at: Date;
}

export interface ApiSettings {
  id: string;
  user_id: string;
  service_type: 'whatsapp' | 'email';
  encrypted_config: string;
  is_active: boolean;
  last_tested: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: Omit<User, 'password_hash'>;
  message?: string;
}

export interface UploadResponse {
  session_id: string;
  codes: Code[];
  total_count: number;
}

export interface SendWhatsAppRequest {
  code_ids: string[];
  phone_number: string;
}

export interface SendEmailRequest {
  code_ids: string[];
  email: string;
  subject?: string;
}

export interface SendResponse {
  success: boolean;
  sent_count: number;
  message?: string;
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
  from_name?: string;
  use_ssl?: boolean;
}

// Tutorial System Types
export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  content: string;
  validation?: TutorialValidation;
  order: number;
}

export interface TutorialValidation {
  required_fields: string[];
  validation_endpoint?: string;
  test_function?: string;
}

export interface Tutorial {
  id: string;
  name: string;
  description: string;
  service_type: 'whatsapp' | 'email';
  steps: TutorialStep[];
  estimated_time: number; // minutes
}

export interface TutorialProgress {
  user_id: string;
  tutorial_id: string;
  current_step: number;
  completed_steps: string[];
  completed: boolean;
  started_at: Date;
  completed_at?: Date;
}

// Enhanced Error Handling Types
export interface RetryConfig {
  max_attempts: number;
  initial_delay: number; // milliseconds
  max_delay: number; // milliseconds
  exponential_base: number;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  retry_possible: boolean;
  timestamp: Date;
}

export interface ConnectivityTestResult {
  success: boolean;
  message: string;
  details?: {
    service_type: 'whatsapp' | 'email';
    endpoint?: string;
    response_time?: number; // milliseconds
    status_code?: number;
    error_code?: string;
    suggestions?: string[];
  };
  timestamp: Date;
}

// Webhook Types
export interface WebhookConfig {
  url: string;
  verify_token: string;
  secret?: string;
}

export interface WhatsAppWebhookEvent {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
          errors?: Array<{
            code: number;
            title: string;
            message: string;
            error_data?: any;
          }>;
        }>;
      };
      field: string;
    }>;
  }>;
}