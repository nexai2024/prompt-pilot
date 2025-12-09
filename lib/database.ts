import { createBrowserClient } from './supabase-browser';

const supabase = createBrowserClient();
import type { Database } from './supabase';

type Tables = Database['public']['Tables'];

// Organizations
export const organizations = {
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        organization_members!inner(role)
      `)
      .eq('organization_members.user_id', userId);

    if (error) throw error;
    return data;
  },

  async create(org: Tables['organizations']['Insert']) {
    const { data, error } = await supabase
      .from('organizations')
      .insert(org)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Tables['organizations']['Update']) {
    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Prompts
export const prompts = {
  async getByOrganization(organizationId: string) {
    const { data, error } = await supabase
      .from('prompts')
      .select(`
        *,
        prompt_variables(*),
        profiles!prompts_created_by_fkey(first_name, last_name)
      `)
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('prompts')
      .select(`
        *,
        prompt_variables(*),
        prompt_versions(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(prompt: Tables['prompts']['Insert']) {
    const { data, error } = await supabase
      .from('prompts')
      .insert(prompt)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Tables['prompts']['Update']) {
    const { data, error } = await supabase
      .from('prompts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Prompt Variables
export const promptVariables = {
  async create(variable: Tables['prompt_variables']['Insert']) {
    const { data, error } = await supabase
      .from('prompt_variables')
      .insert(variable)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Tables['prompt_variables']['Update']) {
    const { data, error } = await supabase
      .from('prompt_variables')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('prompt_variables')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// API Endpoints
export const apiEndpoints = {
  async getByOrganization(organizationId: string) {
    const { data, error } = await supabase
      .from('api_endpoints')
      .select(`
        *,
        prompts(name),
        endpoint_fields(*),
        deployments(*)
      `)
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('api_endpoints')
      .select(`
        *,
        endpoint_fields(*),
        prompts(*),
        deployments(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(endpoint: Tables['api_endpoints']['Insert']) {
    const { data, error } = await supabase
      .from('api_endpoints')
      .insert(endpoint)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Tables['api_endpoints']['Update']) {
    const { data, error } = await supabase
      .from('api_endpoints')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('api_endpoints')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Deployments
export const deployments = {
  async getByOrganization(organizationId: string) {
    const { data, error } = await supabase
      .from('deployments')
      .select(`
        *,
        api_endpoints(name, path),
        profiles!deployments_created_by_fkey(first_name, last_name)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('deployments')
      .select(`
        *,
        api_endpoints(*),
        api_calls(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(deployment: Tables['deployments']['Insert']) {
    const { data, error } = await supabase
      .from('deployments')
      .insert(deployment)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Tables['deployments']['Update']) {
    const { data, error } = await supabase
      .from('deployments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// API Calls (Analytics)
export const apiCalls = {
  async getByOrganization(organizationId: string, options?: {
    startDate?: string;
    endDate?: string;
    deploymentId?: string;
    limit?: number;
  }) {
    let query = supabase
      .from('api_calls')
      .select(`
        *,
        deployments(name, url)
      `)
      .eq('organization_id', organizationId);

    if (options?.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('created_at', options.endDate);
    }
    if (options?.deploymentId) {
      query = query.eq('deployment_id', options.deploymentId);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getStats(organizationId: string, options?: {
    startDate?: string;
    endDate?: string;
  }) {
    let query = supabase
      .from('api_calls')
      .select('status_code, response_time_ms, tokens_used, cost_cents, created_at')
      .eq('organization_id', organizationId);

    if (options?.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('created_at', options.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async create(apiCall: Tables['api_calls']['Insert']) {
    const { data, error } = await supabase
      .from('api_calls')
      .insert(apiCall)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// API Keys
export const apiKeys = {
  async getByOrganization(organizationId: string) {
    const { data, error } = await supabase
      .from('api_keys')
      .select(`
        *,
        profiles!api_keys_created_by_fkey(first_name, last_name)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async create(apiKey: Tables['api_keys']['Insert']) {
    const { data, error } = await supabase
      .from('api_keys')
      .insert(apiKey)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Tables['api_keys']['Update']) {
    const { data, error } = await supabase
      .from('api_keys')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Billing Plans
export const billingPlans = {
  async getAll() {
    const { data, error } = await supabase
      .from('billing_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });

    if (error) throw error;
    return data;
  },
};

// Usage Metrics
export const usageMetrics = {
  async getByOrganization(organizationId: string, metricType?: string) {
    let query = supabase
      .from('usage_metrics')
      .select('*')
      .eq('organization_id', organizationId);

    if (metricType) {
      query = query.eq('metric_type', metricType);
    }

    query = query.order('period_start', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async create(metric: Tables['usage_metrics']['Insert']) {
    const { data, error } = await supabase
      .from('usage_metrics')
      .insert(metric)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};