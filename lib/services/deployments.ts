import { supabase } from '../supabase';

export interface Deployment {
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
}

export const deploymentsService = {
  async list(organizationId: string): Promise<Deployment[]> {
    const { data, error } = await supabase
      .from('deployments')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async get(id: string): Promise<Deployment | null> {
    const { data, error } = await supabase
      .from('deployments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(deployment: Omit<Deployment, 'id' | 'created_at' | 'updated_at'>): Promise<Deployment> {
    const { data, error } = await supabase
      .from('deployments')
      .insert(deployment)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Deployment>): Promise<Deployment> {
    const { data, error } = await supabase
      .from('deployments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('deployments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updateStatus(id: string, status: Deployment['status'], errorMessage?: string): Promise<Deployment> {
    const updates: Partial<Deployment> = { status };

    if (status === 'deployed') {
      updates.deployed_at = new Date().toISOString();
      updates.error_message = null;
    } else if (status === 'failed' && errorMessage) {
      updates.error_message = errorMessage;
    }

    return this.update(id, updates);
  }
};
