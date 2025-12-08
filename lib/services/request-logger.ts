import { supabase } from '../supabase';

export interface APICallLog {
  deployment_id?: string;
  organization_id: string;
  method: string;
  path: string;
  status_code: number;
  response_time_ms: number;
  request_size_bytes?: number;
  response_size_bytes?: number;
  user_agent?: string;
  ip_address?: string;
  country?: string;
  region?: string;
  city?: string;
  error_message?: string;
  tokens_used?: number;
  cost_cents?: number;
}

export const requestLogger = {
  async logAPICall(logData: APICallLog) {
    try {
      const { data, error } = await supabase
        .from('api_calls')
        .insert([logData])
        .select()
        .single();

      if (error) {
        console.error('Failed to log API call:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error logging API call:', error);
      return null;
    }
  },

  async getRecentCalls(organizationId: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('api_calls')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting recent API calls:', error);
      return [];
    }
  },

  async getCallsByDeployment(deploymentId: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('api_calls')
        .select('*')
        .eq('deployment_id', deploymentId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting deployment API calls:', error);
      return [];
    }
  },

  async getAnalytics(organizationId: string, timeRange: '24h' | '7d' | '30d' | '90d' = '7d') {
    try {
      const now = new Date();
      const timeRanges: Record<string, number> = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000,
      };

      const startTime = new Date(now.getTime() - timeRanges[timeRange]);

      const { data, error } = await supabase
        .from('api_calls')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('created_at', startTime.toISOString());

      if (error) {
        throw error;
      }

      const calls = data || [];

      // Calculate analytics
      const totalCalls = calls.length;
      const successfulCalls = calls.filter(c => c.status_code >= 200 && c.status_code < 300).length;
      const errorCalls = calls.filter(c => c.status_code >= 400).length;
      const avgResponseTime = calls.reduce((sum, c) => sum + c.response_time_ms, 0) / (totalCalls || 1);
      const totalTokens = calls.reduce((sum, c) => sum + (c.tokens_used || 0), 0);
      const totalCost = calls.reduce((sum, c) => sum + (c.cost_cents || 0), 0);

      // Group by status code
      const statusCodeDistribution = calls.reduce((acc: Record<string, number>, call) => {
        const statusRange = Math.floor(call.status_code / 100) * 100;
        const key = `${statusRange}xx`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      // Group by region
      const regionDistribution = calls.reduce((acc: Record<string, number>, call) => {
        const region = call.country || 'Unknown';
        acc[region] = (acc[region] || 0) + 1;
        return acc;
      }, {});

      return {
        totalCalls,
        successfulCalls,
        errorCalls,
        successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0,
        avgResponseTime: Math.round(avgResponseTime),
        totalTokens,
        totalCost,
        statusCodeDistribution,
        regionDistribution,
        calls: calls.slice(0, 100) // Return last 100 calls for detailed view
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return null;
    }
  }
};
