import { createBrowserClient } from '../supabase-browser';

const supabase = createBrowserClient();

export interface Prompt {
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
}

export interface PromptVariable {
  id: string;
  prompt_id: string;
  name: string;
  type: string;
  description: string | null;
  default_value: string | null;
  required: boolean;
  created_at: string;
}

export const promptsService = {
  async list(organizationId: string): Promise<Prompt[]> {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async get(id: string): Promise<Prompt | null> {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(prompt: Omit<Prompt, 'id' | 'created_at' | 'updated_at'>): Promise<Prompt> {
    const { data, error } = await supabase
      .from('prompts')
      .insert(prompt)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Prompt>): Promise<Prompt> {
    const { data, error } = await supabase
      .from('prompts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getVariables(promptId: string): Promise<PromptVariable[]> {
    const { data, error } = await supabase
      .from('prompt_variables')
      .select('*')
      .eq('prompt_id', promptId)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async upsertVariables(promptId: string, variables: Omit<PromptVariable, 'id' | 'created_at'>[]): Promise<void> {
    const { error: deleteError } = await supabase
      .from('prompt_variables')
      .delete()
      .eq('prompt_id', promptId);

    if (deleteError) throw deleteError;

    if (variables.length > 0) {
      const { error: insertError } = await supabase
        .from('prompt_variables')
        .insert(variables);

      if (insertError) throw insertError;
    }
  },

  extractVariables(content: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = Array.from(content.matchAll(regex));
    const variables = new Set<string>();

    for (const match of matches) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  },

  replaceVariables(content: string, values: Record<string, string>): string {
    let result = content;
    for (const [key, value] of Object.entries(values)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return result;
  }
};
