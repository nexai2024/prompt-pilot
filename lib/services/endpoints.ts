import { createBrowserClient } from '../supabase-browser';

const supabase = createBrowserClient();

export interface ApiEndpoint {
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
}

export interface EndpointField {
  id: string;
  endpoint_id: string;
  field_name: string;
  field_type: string;
  field_location: 'body' | 'query' | 'header' | 'path';
  required: boolean;
  description: string | null;
  default_value: string | null;
  validation_rules: Record<string, any> | null;
  created_at: string;
}

export const endpointsService = {
  async list(organizationId: string): Promise<ApiEndpoint[]> {
    const { data, error } = await supabase
      .from('api_endpoints')
      .select('*')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async get(id: string): Promise<ApiEndpoint | null> {
    const { data, error } = await supabase
      .from('api_endpoints')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(endpoint: Omit<ApiEndpoint, 'id' | 'created_at' | 'updated_at'>): Promise<ApiEndpoint> {
    const { data, error } = await supabase
      .from('api_endpoints')
      .insert(endpoint)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<ApiEndpoint>): Promise<ApiEndpoint> {
    const { data, error } = await supabase
      .from('api_endpoints')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('api_endpoints')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getFields(endpointId: string): Promise<EndpointField[]> {
    const { data, error } = await supabase
      .from('endpoint_fields')
      .select('*')
      .eq('endpoint_id', endpointId)
      .order('field_name');

    if (error) throw error;
    return data || [];
  },

  async upsertFields(endpointId: string, fields: Omit<EndpointField, 'id' | 'created_at'>[]): Promise<void> {
    const { error: deleteError } = await supabase
      .from('endpoint_fields')
      .delete()
      .eq('endpoint_id', endpointId);

    if (deleteError) throw deleteError;

    if (fields.length > 0) {
      const { error: insertError } = await supabase
        .from('endpoint_fields')
        .insert(fields);

      if (insertError) throw insertError;
    }
  }
};
