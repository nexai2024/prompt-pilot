import { createClient } from '@supabase/supabase-js';

// Check if we're in the browser and have the required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Please check your .env.local file.');
}

// Create a fallback client for development
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          company: string | null;
          bio: string | null;
          timezone: string;
          email_notifications: boolean;
          marketing_notifications: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          company?: string | null;
          bio?: string | null;
          timezone?: string;
          email_notifications?: boolean;
          marketing_notifications?: boolean;
        };
        Update: {
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          company?: string | null;
          bio?: string | null;
          timezone?: string;
          email_notifications?: boolean;
          marketing_notifications?: boolean;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          avatar_url: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          slug: string;
          description?: string | null;
          avatar_url?: string | null;
          created_by: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          avatar_url?: string | null;
        };
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'developer' | 'viewer';
          invited_by: string | null;
          joined_at: string;
        };
        Insert: {
          organization_id: string;
          user_id: string;
          role?: 'owner' | 'admin' | 'developer' | 'viewer';
          invited_by?: string | null;
        };
        Update: {
          role?: 'owner' | 'admin' | 'developer' | 'viewer';
        };
      };
      prompts: {
        Row: {
          id: string;
          organization_id: string;
          created_by: string;
          name: string;
          description: string | null;
          content: string;
          status: 'draft' | 'testing' | 'deployed' | 'archived';
          model: string;
          temperature: number;
          max_tokens: number;
          top_p: number;
          frequency_penalty: number;
          presence_penalty: number;
          stop_sequences: string[] | null;
          response_format: string;
          streaming: boolean;
          content_filtering: boolean;
          caching: boolean;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          created_by: string;
          name: string;
          description?: string | null;
          content: string;
          status?: 'draft' | 'testing' | 'deployed' | 'archived';
          model?: string;
          temperature?: number;
          max_tokens?: number;
          top_p?: number;
          frequency_penalty?: number;
          presence_penalty?: number;
          stop_sequences?: string[] | null;
          response_format?: string;
          streaming?: boolean;
          content_filtering?: boolean;
          caching?: boolean;
          tags?: string[];
        };
        Update: {
          name?: string;
          description?: string | null;
          content?: string;
          status?: 'draft' | 'testing' | 'deployed' | 'archived';
          model?: string;
          temperature?: number;
          max_tokens?: number;
          top_p?: number;
          frequency_penalty?: number;
          presence_penalty?: number;
          stop_sequences?: string[] | null;
          response_format?: string;
          streaming?: boolean;
          content_filtering?: boolean;
          caching?: boolean;
          tags?: string[];
        };
      };
      prompt_variables: {
        Row: {
          id: string;
          prompt_id: string;
          name: string;
          type: string;
          description: string | null;
          default_value: string | null;
          required: boolean;
          created_at: string;
        };
        Insert: {
          prompt_id: string;
          name: string;
          type?: string;
          description?: string | null;
          default_value?: string | null;
          required?: boolean;
        };
        Update: {
          name?: string;
          type?: string;
          description?: string | null;
          default_value?: string | null;
          required?: boolean;
        };
      };
      api_endpoints: {
        Row: {
          id: string;
          organization_id: string;
          created_by: string;
          prompt_id: string | null;
          name: string;
          description: string | null;
          method: string;
          path: string;
          authentication: string;
          rate_limit: number;
          cors_enabled: boolean;
          request_validation: boolean;
          request_logging: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          created_by: string;
          prompt_id?: string | null;
          name: string;
          description?: string | null;
          method?: string;
          path: string;
          authentication?: string;
          rate_limit?: number;
          cors_enabled?: boolean;
          request_validation?: boolean;
          request_logging?: boolean;
        };
        Update: {
          prompt_id?: string | null;
          name?: string;
          description?: string | null;
          method?: string;
          path?: string;
          authentication?: string;
          rate_limit?: number;
          cors_enabled?: boolean;
          request_validation?: boolean;
          request_logging?: boolean;
        };
      };
      deployments: {
        Row: {
          id: string;
          organization_id: string;
          endpoint_id: string;
          created_by: string;
          name: string;
          url: string;
          status: 'building' | 'deployed' | 'failed' | 'paused';
          environment: string;
          version: string;
          region: string;
          custom_domain: string | null;
          build_logs: string | null;
          error_message: string | null;
          deployed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          endpoint_id: string;
          created_by: string;
          name: string;
          url: string;
          status?: 'building' | 'deployed' | 'failed' | 'paused';
          environment?: string;
          version?: string;
          region?: string;
          custom_domain?: string | null;
          build_logs?: string | null;
          error_message?: string | null;
          deployed_at?: string | null;
        };
        Update: {
          name?: string;
          url?: string;
          status?: 'building' | 'deployed' | 'failed' | 'paused';
          environment?: string;
          version?: string;
          region?: string;
          custom_domain?: string | null;
          build_logs?: string | null;
          error_message?: string | null;
          deployed_at?: string | null;
        };
      };
      api_calls: {
        Row: {
          id: string;
          deployment_id: string;
          organization_id: string;
          method: string;
          path: string;
          status_code: number;
          response_time_ms: number;
          request_size_bytes: number;
          response_size_bytes: number;
          user_agent: string | null;
          ip_address: string | null;
          country: string | null;
          region: string | null;
          city: string | null;
          error_message: string | null;
          tokens_used: number;
          cost_cents: number;
          created_at: string;
        };
        Insert: {
          deployment_id: string;
          organization_id: string;
          method: string;
          path: string;
          status_code: number;
          response_time_ms: number;
          request_size_bytes?: number;
          response_size_bytes?: number;
          user_agent?: string | null;
          ip_address?: string | null;
          country?: string | null;
          region?: string | null;
          city?: string | null;
          error_message?: string | null;
          tokens_used?: number;
          cost_cents?: number;
        };
        Update: {
          status_code?: number;
          response_time_ms?: number;
          request_size_bytes?: number;
          response_size_bytes?: number;
          error_message?: string | null;
          tokens_used?: number;
          cost_cents?: number;
        };
      };
      billing_plans: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price_monthly: number;
          price_yearly: number;
          max_apis: number;
          max_api_calls: number;
          max_storage_gb: number;
          features: string[];
          is_active: boolean;
          created_at: string;
        };
      };
      api_keys: {
        Row: {
          id: string;
          organization_id: string;
          created_by: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          permissions: string[];
          last_used_at: string | null;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          organization_id: string;
          created_by: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          permissions?: string[];
          expires_at?: string | null;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          permissions?: string[];
          expires_at?: string | null;
          is_active?: boolean;
          last_used_at?: string | null;
        };
      };
      usage_metrics: {
        Row: {
          id: string;
          organization_id: string;
          metric_type: string;
          value: number;
          period_start: string;
          period_end: string;
          created_at: string;
        };
        Insert: {
          organization_id: string;
          metric_type: string;
          value: number;
          period_start: string;
          period_end: string;
        };
        Update: {
          value?: number;
          period_start?: string;
          period_end?: string;
        };
      };
    };
  };
}