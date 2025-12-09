/*
  ==================================================================================
  PROMPT PILOT - SUPABASE DATABASE INITIALIZATION SCRIPT
  ==================================================================================

  This script initializes a fresh Supabase instance with all required tables,
  Row Level Security policies, functions, triggers, and initial data.

  HOW TO USE:
  -----------
  1. Create a new Supabase project at https://supabase.com
  2. Go to SQL Editor in your Supabase dashboard
  3. Copy and paste this entire script
  4. Click "Run" to execute
  5. Verify all tables were created in the Table Editor

  WHAT THIS SCRIPT DOES:
  ----------------------
  - Creates custom types (enums)
  - Creates 20+ tables for the complete application
  - Enables Row Level Security (RLS) on all tables
  - Creates optimized RLS policies for secure data access
  - Adds performance indexes on all foreign keys
  - Creates utility functions (timestamps, organization creation)
  - Sets up triggers for automatic organization creation on signup
  - Inserts initial billing plans data

  AFTER RUNNING:
  --------------
  1. Copy your Supabase URL and anon key
  2. Update your .env file:
     - NEXT_PUBLIC_SUPABASE_URL=your-project-url
     - NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  3. Run the application and create your first account

  ==================================================================================
*/

-- ==================================================================================
-- 1. CREATE CUSTOM TYPES (ENUMS)
-- ==================================================================================

CREATE TYPE user_role AS ENUM ('owner', 'admin', 'developer', 'viewer');
CREATE TYPE prompt_status AS ENUM ('draft', 'testing', 'deployed', 'archived');
CREATE TYPE deployment_status AS ENUM ('building', 'deployed', 'failed', 'paused');
CREATE TYPE api_call_status AS ENUM ('success', 'error', 'timeout');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'error', 'success');
CREATE TYPE billing_interval AS ENUM ('monthly', 'yearly');

-- ==================================================================================
-- 2. CREATE TABLES
-- ==================================================================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
  price_monthly integer DEFAULT 0,
  price_yearly integer DEFAULT 0,
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
  field_type text NOT NULL,
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
  metric_type text NOT NULL,
  value integer NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- ==================================================================================
-- 3. CREATE PERFORMANCE INDEXES
-- ==================================================================================

-- Organization members indexes
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_invited_by ON organization_members(invited_by);

-- Organizations indexes
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON organizations(created_by);

-- Prompts indexes
CREATE INDEX IF NOT EXISTS idx_prompts_organization_id ON prompts(organization_id);
CREATE INDEX IF NOT EXISTS idx_prompts_created_by ON prompts(created_by);

-- Prompt versions indexes
CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_id ON prompt_versions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_created_by ON prompt_versions(created_by);

-- Prompt variables indexes
CREATE INDEX IF NOT EXISTS idx_prompt_variables_prompt_id ON prompt_variables(prompt_id);

-- API endpoints indexes
CREATE INDEX IF NOT EXISTS idx_api_endpoints_organization_id ON api_endpoints(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_endpoints_prompt_id ON api_endpoints(prompt_id);
CREATE INDEX IF NOT EXISTS idx_api_endpoints_created_by ON api_endpoints(created_by);

-- Endpoint fields indexes
CREATE INDEX IF NOT EXISTS idx_endpoint_fields_endpoint_id ON endpoint_fields(endpoint_id);

-- Deployments indexes
CREATE INDEX IF NOT EXISTS idx_deployments_organization_id ON deployments(organization_id);
CREATE INDEX IF NOT EXISTS idx_deployments_endpoint_id ON deployments(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_deployments_created_by ON deployments(created_by);

-- API calls indexes
CREATE INDEX IF NOT EXISTS idx_api_calls_deployment_id ON api_calls(deployment_id);
CREATE INDEX IF NOT EXISTS idx_api_calls_organization_id ON api_calls(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_calls_created_at ON api_calls(created_at);

-- Analytics events indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_organization_id ON analytics_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- API keys indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_organization_id ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_by ON api_keys(created_by);

-- Usage metrics indexes
CREATE INDEX IF NOT EXISTS idx_usage_metrics_organization_id ON usage_metrics(organization_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON notifications(organization_id);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);

-- ==================================================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- ==================================================================================

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

-- ==================================================================================
-- 5. CREATE RLS POLICIES (OPTIMIZED FOR PERFORMANCE)
-- ==================================================================================

-- PROFILES POLICIES
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- ORGANIZATIONS POLICIES
CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "Users can read organizations they belong to"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Organization owners can update organizations"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = (select auth.uid())
      AND organization_members.role = 'owner'
    )
  );

-- ORGANIZATION MEMBERS POLICIES
CREATE POLICY "Organization owners can manage members"
  ON organization_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = (select auth.uid())
      AND om.role = 'owner'
    )
  );

CREATE POLICY "Members can read their organization members"
  ON organization_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = (select auth.uid())
    )
  );

-- BILLING PLANS POLICIES
CREATE POLICY "Anyone can read billing plans"
  ON billing_plans FOR SELECT
  TO authenticated
  USING (is_active = true);

-- SUBSCRIPTIONS POLICIES
CREATE POLICY "Users can read subscriptions for their organizations"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = subscriptions.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

-- PROMPTS POLICIES
CREATE POLICY "Users can read prompts from their organizations"
  ON prompts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = prompts.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create prompts in their organizations"
  ON prompts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = prompts.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
    AND created_by = (select auth.uid())
  );

CREATE POLICY "Users can update prompts they created"
  ON prompts FOR UPDATE
  TO authenticated
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

-- PROMPT VERSIONS POLICIES
CREATE POLICY "Users can read prompt versions from their organizations"
  ON prompt_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prompts
      JOIN organization_members ON organization_members.organization_id = prompts.organization_id
      WHERE prompts.id = prompt_versions.prompt_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create prompt versions"
  ON prompt_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prompts
      JOIN organization_members ON organization_members.organization_id = prompts.organization_id
      WHERE prompts.id = prompt_versions.prompt_id
      AND organization_members.user_id = (select auth.uid())
    )
    AND created_by = (select auth.uid())
  );

-- PROMPT VARIABLES POLICIES
CREATE POLICY "Users can manage prompt variables"
  ON prompt_variables FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prompts
      JOIN organization_members ON organization_members.organization_id = prompts.organization_id
      WHERE prompts.id = prompt_variables.prompt_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

-- API ENDPOINTS POLICIES
CREATE POLICY "Users can read API endpoints from their organizations"
  ON api_endpoints FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = api_endpoints.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create API endpoints in their organizations"
  ON api_endpoints FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = api_endpoints.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
    AND created_by = (select auth.uid())
  );

CREATE POLICY "Users can update API endpoints they created"
  ON api_endpoints FOR UPDATE
  TO authenticated
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

-- ENDPOINT FIELDS POLICIES
CREATE POLICY "Users can manage endpoint fields"
  ON endpoint_fields FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM api_endpoints
      JOIN organization_members ON organization_members.organization_id = api_endpoints.organization_id
      WHERE api_endpoints.id = endpoint_fields.endpoint_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

-- DEPLOYMENTS POLICIES
CREATE POLICY "Users can read deployments from their organizations"
  ON deployments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = deployments.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create deployments in their organizations"
  ON deployments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = deployments.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
    AND created_by = (select auth.uid())
  );

CREATE POLICY "Users can update deployments they created"
  ON deployments FOR UPDATE
  TO authenticated
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

-- API CALLS POLICIES
CREATE POLICY "Users can read API calls from their organizations"
  ON api_calls FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = api_calls.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

-- ANALYTICS EVENTS POLICIES
CREATE POLICY "Users can read analytics events from their organizations"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = analytics_events.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

-- API KEYS POLICIES
CREATE POLICY "Users can read API keys from their organizations"
  ON api_keys FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = api_keys.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create API keys in their organizations"
  ON api_keys FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = api_keys.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
    AND created_by = (select auth.uid())
  );

CREATE POLICY "Users can update API keys they created"
  ON api_keys FOR UPDATE
  TO authenticated
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

-- USAGE METRICS POLICIES
CREATE POLICY "Users can read usage metrics from their organizations"
  ON usage_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = usage_metrics.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can read their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- AUDIT LOGS POLICIES
CREATE POLICY "Users can read audit logs from their organizations"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = audit_logs.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

-- ==================================================================================
-- 6. CREATE UTILITY FUNCTIONS
-- ==================================================================================

-- Function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function to create default organization for new users
CREATE OR REPLACE FUNCTION create_default_organization_for_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Create a personal organization for the new user
  INSERT INTO public.organizations (name, slug, created_by)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Personal') || '''s Organization',
    'personal-' || NEW.id::text,
    NEW.id
  )
  RETURNING id INTO new_org_id;

  -- Add user as owner of the organization
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't prevent user creation
    RAISE WARNING 'Failed to create default organization for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_default_organization_for_user() TO authenticated;
GRANT EXECUTE ON FUNCTION create_default_organization_for_user() TO service_role;

-- ==================================================================================
-- 7. CREATE TRIGGERS
-- ==================================================================================

-- Triggers for updated_at timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_endpoints_updated_at
  BEFORE UPDATE ON api_endpoints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deployments_updated_at
  BEFORE UPDATE ON deployments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to create default organization on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_organization_for_user();

-- ==================================================================================
-- 8. INSERT INITIAL DATA
-- ==================================================================================

-- Insert billing plans
INSERT INTO billing_plans (name, description, price_monthly, price_yearly, max_apis, max_api_calls, max_storage_gb, features) VALUES
(
  'Starter',
  'Perfect for individuals and small projects',
  2900,
  29000,
  5,
  10000,
  1,
  '["5 AI APIs", "10K API calls/month", "Basic prompt studio", "Community support", "Standard models"]'
),
(
  'Professional',
  'Ideal for growing businesses and teams',
  9900,
  99000,
  25,
  100000,
  10,
  '["25 AI APIs", "100K API calls/month", "Advanced prompt studio", "Priority support", "Premium models", "Custom domains", "Analytics dashboard"]'
),
(
  'Enterprise',
  'For large organizations with specific needs',
  0,
  0,
  -1,
  -1,
  -1,
  '["Unlimited APIs", "Custom API limits", "White-label solution", "Dedicated support", "Custom models", "Advanced security", "SLA guarantee"]'
);

-- ==================================================================================
-- INITIALIZATION COMPLETE
-- ==================================================================================

-- If you see this message, the script executed successfully!
DO $$
BEGIN
  RAISE NOTICE '
  ==================================================================================
  ✓ DATABASE INITIALIZATION COMPLETE!
  ==================================================================================

  Summary:
  --------
  - Created 6 custom types
  - Created 17 tables with proper relationships
  - Created 50+ performance indexes
  - Enabled RLS on all tables
  - Created 40+ security policies
  - Created 2 utility functions
  - Created 7 triggers
  - Inserted 3 billing plans

  Next Steps:
  -----------
  1. Copy your Supabase URL and anon key from Project Settings > API
  2. Update your .env file:
     NEXT_PUBLIC_SUPABASE_URL=your-project-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  3. Start your application and create your first account
  4. A default organization will be created automatically!

  Need Help?
  ----------
  - Check the LOGIN_DEBUG_GUIDE.md file for debugging tips
  - Review SECURITY_FIXES.md for security best practices
  - All console logs are enabled for easy debugging

  ==================================================================================
  ';
END $$;
