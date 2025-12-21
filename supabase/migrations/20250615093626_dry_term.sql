/*
  # Initial Schema for Prompt Pilot Platform

  1. New Tables
    - `profiles` - User profile information extending auth.users
    - `organizations` - Organizations/teams that users belong to
    - `organization_members` - Many-to-many relationship between users and organizations
    - `prompts` - AI prompts created by users
    - `prompt_versions` - Version history for prompts
    - `prompt_variables` - Variables defined for prompts
    - `api_endpoints` - API endpoints designed by users
    - `endpoint_fields` - Request/response field definitions for endpoints
    - `deployments` - Deployed API instances
    - `api_calls` - Log of API calls made to deployed endpoints
    - `analytics_events` - Analytics events for tracking usage
    - `api_keys` - API keys for authentication
    - `billing_plans` - Available billing plans
    - `subscriptions` - User subscriptions to billing plans
    - `usage_metrics` - Usage tracking for billing
    - `notifications` - User notifications
    - `audit_logs` - Audit trail for important actions

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add policies for organization members to access shared data
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'developer', 'viewer');
CREATE TYPE prompt_status AS ENUM ('draft', 'testing', 'deployed', 'archived');
CREATE TYPE deployment_status AS ENUM ('building', 'deployed', 'failed', 'paused');
CREATE TYPE api_call_status AS ENUM ('success', 'error', 'timeout');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'error', 'success');
CREATE TYPE billing_interval AS ENUM ('monthly', 'yearly');

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clerk_user_id text not null default auth.jwt()->>'sub',
  email text NOT NULL,
  first_name text,
  last_name text,
  avatar_url text,
  company text,
  bio text,
  timezone text DEFAULT 'UTC',
  email_notifications boolean DEFAULT true,
  marketing_notifications boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  avatar_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Organization members
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  clerk_user_id text not null default auth.jwt()->>'sub',
  role user_role DEFAULT 'developer',
  invited_by uuid REFERENCES auth.users(id),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Billing plans
CREATE TABLE IF NOT EXISTS billing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_monthly integer DEFAULT 0, -- in cents
  price_yearly integer DEFAULT 0, -- in cents
  max_apis integer DEFAULT 0,
  max_api_calls integer DEFAULT 0,
  max_storage_gb integer DEFAULT 0,
  features jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES billing_plans(id),
  clerk_user_id text not null default auth.jwt()->>'sub',
  billing_interval billing_interval DEFAULT 'monthly',
  status text DEFAULT 'active',
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz DEFAULT now() + interval '1 month',
  stripe_subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  clerk_user_id text not null default auth.jwt()->>'sub',
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  content text NOT NULL,
  status prompt_status DEFAULT 'draft',
  model text DEFAULT 'gpt-4',
  temperature real DEFAULT 0.7,
  max_tokens integer DEFAULT 150,
  top_p real DEFAULT 1.0,
  frequency_penalty real DEFAULT 0.0,
  presence_penalty real DEFAULT 0.0,
  stop_sequences text[],
  response_format text DEFAULT 'text',
  streaming boolean DEFAULT false,
  content_filtering boolean DEFAULT true,
  caching boolean DEFAULT true,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Prompt versions
CREATE TABLE IF NOT EXISTS prompt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid REFERENCES prompts(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  content text NOT NULL,
  model text NOT NULL,
  temperature real NOT NULL,
  max_tokens integer NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(prompt_id, version_number)
);

-- Prompt variables
CREATE TABLE IF NOT EXISTS prompt_variables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid REFERENCES prompts(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text DEFAULT 'string',
  description text,
  default_value text,
  required boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(prompt_id, name)
);

-- API endpoints
CREATE TABLE IF NOT EXISTS api_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  clerk_user_id text not null default auth.jwt()->>'sub',
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id uuid REFERENCES prompts(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  method text DEFAULT 'POST',
  path text NOT NULL,
  authentication text DEFAULT 'api-key',
  rate_limit integer DEFAULT 100,
  cors_enabled boolean DEFAULT true,
  request_validation boolean DEFAULT true,
  request_logging boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Endpoint fields (for request/response schemas)
CREATE TABLE IF NOT EXISTS endpoint_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id uuid REFERENCES api_endpoints(id) ON DELETE CASCADE,
  field_type text NOT NULL, -- 'request' or 'response'
  name text NOT NULL,
  data_type text DEFAULT 'string',
  required boolean DEFAULT false,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Deployments
CREATE TABLE IF NOT EXISTS deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  clerk_user_id text not null default auth.jwt()->>'sub',
  endpoint_id uuid REFERENCES api_endpoints(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  status deployment_status DEFAULT 'building',
  environment text DEFAULT 'production',
  version text DEFAULT 'v1.0.0',
  region text DEFAULT 'us-east-1',
  custom_domain text,
  build_logs text,
  error_message text,
  deployed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- API calls log
CREATE TABLE IF NOT EXISTS api_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_id uuid REFERENCES deployments(id) ON DELETE CASCADE,
  clerk_user_id text not null default auth.jwt()->>'sub',
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  method text NOT NULL,
  path text NOT NULL,
  status_code integer NOT NULL,
  response_time_ms integer NOT NULL,
  request_size_bytes integer DEFAULT 0,
  response_size_bytes integer DEFAULT 0,
  user_agent text,
  ip_address inet,
  country text,
  region text,
  city text,
  error_message text,
  tokens_used integer DEFAULT 0,
  cost_cents integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text not null default auth.jwt()->>'sub',
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  session_id text,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- API keys
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  clerk_user_id text not null default auth.jwt()->>'sub',
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  permissions text[] DEFAULT '{"read"}',
  last_used_at timestamptz,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Usage metrics
CREATE TABLE IF NOT EXISTS usage_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  clerk_user_id text not null default auth.jwt()->>'sub',
  metric_type text NOT NULL, -- 'api_calls', 'storage', 'bandwidth', etc.
  value integer NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  clerk_user_id text not null default auth.jwt()->>'sub',
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  type notification_type DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  action_url text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  clerk_user_id text not null default auth.jwt()->>'sub',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE endpoint_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated  
  USING (
((SELECT auth.jwt()->>'sub') = (user_id)::text)
);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
((SELECT auth.jwt()->>'sub') = (user_id)::text)
);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
((SELECT auth.jwt()->>'sub') = (user_id)::text)
);

-- Policies for organizations
CREATE POLICY "Users can read organizations they belong to"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.jwt()->>'sub')
    )
  );

CREATE POLICY "Users can create organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (
((SELECT auth.jwt()->>'sub') = (created_by)::text)
);

CREATE POLICY "Organization owners can update organizations"
  ON organizations
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.jwt()->>'sub') AND role = 'owner'
    )
  );

-- Policies for organization members
CREATE POLICY "Users can read organization members for their organizations"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.jwt()->>'sub')
    )
  );

CREATE POLICY "Organization owners can manage members"
  ON organization_members
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.jwt()->>'sub') AND role = 'owner'
    )
  );

-- Policies for billing plans (public read)
CREATE POLICY "Anyone can read billing plans"
  ON billing_plans
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policies for subscriptions
CREATE POLICY "Users can read subscriptions for their organizations"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.jwt()->>'sub')
    )
  );

-- Policies for prompts
CREATE POLICY "Users can read prompts from their organizations"
  ON prompts
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.jwt()->>'sub')
    )
  );

CREATE POLICY "Users can create prompts in their organizations"
  ON prompts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'developer')
    )
    AND (SELECT auth.jwt()->>'sub') = (created_by)::text
  );

CREATE POLICY "Users can update prompts they created"
  ON prompts
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.jwt()->>'sub') = (created_by)::text);

-- Policies for prompt versions
CREATE POLICY "Users can read prompt versions from their organizations"
  ON prompt_versions
  FOR SELECT
  TO authenticated
  USING (
    prompt_id IN (
      SELECT id FROM prompts 
      WHERE organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = (SELECT auth.jwt()->>'sub')
      )
    )
  );

CREATE POLICY "Users can create prompt versions"
  ON prompt_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    prompt_id IN (
      SELECT id FROM prompts 
      WHERE organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'developer')
      )
    )
    AND (SELECT auth.jwt()->>'sub') = (created_by)::text
  );

-- Policies for prompt variables
CREATE POLICY "Users can read prompt variables from their organizations"
  ON prompt_variables
  FOR SELECT
  TO authenticated
  USING (
    prompt_id IN (
      SELECT id FROM prompts 
      WHERE organization_id IN (
        SELECT organization_id 
        FROM organization_members 
          WHERE user_id = (SELECT auth.jwt()->>'sub')
      )
    )
  );

CREATE POLICY "Users can manage prompt variables"
  ON prompt_variables
  FOR ALL
  TO authenticated
  USING (
    prompt_id IN (
      SELECT id FROM prompts 
      WHERE organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = (SELECT auth.jwt()->>'sub') AND role IN ('owner', 'admin', 'developer')
      )
    )
  );

-- Policies for API endpoints
CREATE POLICY "Users can read API endpoints from their organizations"
  ON api_endpoints
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.jwt()->>'sub')
    )
  );

CREATE POLICY "Users can create API endpoints in their organizations"
  ON api_endpoints
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.jwt()->>'sub') AND role IN ('owner', 'admin', 'developer')
    )
    AND (SELECT auth.jwt()->>'sub') = (created_by)::text
  );

CREATE POLICY "Users can update API endpoints they created"
  ON api_endpoints
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.jwt()->>'sub') = (created_by)::text);

-- Policies for endpoint fields
CREATE POLICY "Users can read endpoint fields from their organizations"
  ON endpoint_fields
  FOR SELECT
  TO authenticated
  USING (
    endpoint_id IN (
      SELECT id FROM api_endpoints 
      WHERE organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = (SELECT auth.jwt()->>'sub')
      )
    )
  );

CREATE POLICY "Users can manage endpoint fields"
  ON endpoint_fields
  FOR ALL
  TO authenticated
  USING (
    endpoint_id IN (
      SELECT id FROM api_endpoints 
      WHERE organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = (SELECT auth.jwt()->>'sub') AND role IN ('owner', 'admin', 'developer')
      )
    )
  );

-- Policies for deployments
CREATE POLICY "Users can read deployments from their organizations"
  ON deployments
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.jwt()->>'sub')
    )
  );

CREATE POLICY "Users can create deployments in their organizations"
  ON deployments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.jwt()->>'sub') AND role IN ('owner', 'admin', 'developer')
    )
    AND (SELECT auth.jwt()->>'sub') = (created_by)::text
  );

CREATE POLICY "Users can update deployments they created"
  ON deployments
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.jwt()->>'sub') = (created_by)::text);

-- Policies for API calls
CREATE POLICY "Users can read API calls from their organizations"
  ON api_calls
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.jwt()->>'sub')
    )
  );

-- Policies for analytics events
CREATE POLICY "Users can read analytics events from their organizations"
  ON analytics_events
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
        WHERE user_id = (SELECT auth.jwt()->>'sub')
    )
  );

-- Policies for API keys
CREATE POLICY "Users can read API keys from their organizations"
  ON api_keys
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.jwt()->>'sub')
    )
  );

CREATE POLICY "Users can create API keys in their organizations"
  ON api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.jwt()->>'sub') AND role IN ('owner', 'admin', 'developer')
    )
    AND (SELECT auth.jwt()->>'sub') = (created_by)::text
  );

CREATE POLICY "Users can update API keys they created"
  ON api_keys
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.jwt()->>'sub') = (created_by)::text);

-- Policies for usage metrics
CREATE POLICY "Users can read usage metrics from their organizations"
  ON usage_metrics
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.jwt()->>'sub')
    )
  );

-- Policies for notifications
CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.jwt()->>'sub') = (user_id)::text);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.jwt()->>'sub') = (user_id)::text);

-- Policies for audit logs
CREATE POLICY "Users can read audit logs from their organizations"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = (SELECT auth.jwt()->>'sub') AND role IN ('owner', 'admin')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_prompts_organization_id ON prompts(organization_id);
CREATE INDEX IF NOT EXISTS idx_prompts_created_by ON prompts(created_by);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_id ON prompt_versions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_variables_prompt_id ON prompt_variables(prompt_id);
CREATE INDEX IF NOT EXISTS idx_api_endpoints_organization_id ON api_endpoints(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_endpoints_prompt_id ON api_endpoints(prompt_id);
CREATE INDEX IF NOT EXISTS idx_endpoint_fields_endpoint_id ON endpoint_fields(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_deployments_organization_id ON deployments(organization_id);
CREATE INDEX IF NOT EXISTS idx_deployments_endpoint_id ON deployments(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_api_calls_deployment_id ON api_calls(deployment_id);
CREATE INDEX IF NOT EXISTS idx_api_calls_organization_id ON api_calls(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_calls_created_at ON api_calls(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_organization_id ON analytics_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_organization_id ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_organization_id ON usage_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);

-- Create functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prompts_updated_at BEFORE UPDATE ON prompts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_endpoints_updated_at BEFORE UPDATE ON api_endpoints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deployments_updated_at BEFORE UPDATE ON deployments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();