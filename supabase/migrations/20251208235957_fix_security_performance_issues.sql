/*
  # Fix Security and Performance Issues

  ## Changes Made
  
  1. **Add Missing Foreign Key Indexes**
     - Creates indexes on all foreign key columns that were missing them
     - Improves query performance for joins and lookups
     - Tables affected: analytics_events, api_endpoints, api_keys, audit_logs, deployments, notifications, organization_members, organizations, prompt_versions, subscriptions

  2. **Optimize RLS Policies**
     - Replaces `auth.uid()` with `(select auth.uid())` in all RLS policies
     - Prevents re-evaluation of auth function for each row
     - Significantly improves query performance at scale
     - All tables with RLS policies are updated

  3. **Fix Function Search Path**
     - Sets immutable search_path for `update_updated_at_column` function
     - Prevents security issues from search_path manipulation

  4. **Consolidate Duplicate Policies**
     - Removes redundant SELECT policies where multiple exist
     - Keeps the most comprehensive policy
     - Tables affected: endpoint_fields, organization_members, prompt_variables

  ## Security Notes
  - All changes maintain existing security constraints
  - No data access patterns are changed
  - Performance improvements only, no functionality changes
*/

-- =====================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

-- Analytics events
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);

-- API endpoints
CREATE INDEX IF NOT EXISTS idx_api_endpoints_created_by ON api_endpoints(created_by);

-- API keys
CREATE INDEX IF NOT EXISTS idx_api_keys_created_by ON api_keys(created_by);

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Deployments
CREATE INDEX IF NOT EXISTS idx_deployments_created_by ON deployments(created_by);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON notifications(organization_id);

-- Organization members
CREATE INDEX IF NOT EXISTS idx_organization_members_invited_by ON organization_members(invited_by);

-- Organizations
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON organizations(created_by);

-- Prompt versions
CREATE INDEX IF NOT EXISTS idx_prompt_versions_created_by ON prompt_versions(created_by);

-- Subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);

-- =====================================================
-- 2. OPTIMIZE RLS POLICIES - PROFILES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- =====================================================
-- 3. OPTIMIZE RLS POLICIES - ORGANIZATIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

DROP POLICY IF EXISTS "Users can read organizations they belong to" ON organizations;
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

DROP POLICY IF EXISTS "Organization owners can update organizations" ON organizations;
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

-- =====================================================
-- 4. OPTIMIZE RLS POLICIES - ORGANIZATION_MEMBERS TABLE
-- =====================================================

-- Remove duplicate policy and keep the comprehensive one
DROP POLICY IF EXISTS "Users can read organization members for their organizations" ON organization_members;

DROP POLICY IF EXISTS "Organization owners can manage members" ON organization_members;
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

-- Add separate read policy for all members
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

-- =====================================================
-- 5. OPTIMIZE RLS POLICIES - SUBSCRIPTIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can read subscriptions for their organizations" ON subscriptions;
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

-- =====================================================
-- 6. OPTIMIZE RLS POLICIES - PROMPTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can read prompts from their organizations" ON prompts;
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

DROP POLICY IF EXISTS "Users can create prompts in their organizations" ON prompts;
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

DROP POLICY IF EXISTS "Users can update prompts they created" ON prompts;
CREATE POLICY "Users can update prompts they created"
  ON prompts FOR UPDATE
  TO authenticated
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

-- =====================================================
-- 7. OPTIMIZE RLS POLICIES - PROMPT_VERSIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can read prompt versions from their organizations" ON prompt_versions;
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

DROP POLICY IF EXISTS "Users can create prompt versions" ON prompt_versions;
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

-- =====================================================
-- 8. OPTIMIZE RLS POLICIES - PROMPT_VARIABLES TABLE
-- =====================================================

-- Remove duplicate policy
DROP POLICY IF EXISTS "Users can read prompt variables from their organizations" ON prompt_variables;

DROP POLICY IF EXISTS "Users can manage prompt variables" ON prompt_variables;
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

-- =====================================================
-- 9. OPTIMIZE RLS POLICIES - API_ENDPOINTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can read API endpoints from their organizations" ON api_endpoints;
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

DROP POLICY IF EXISTS "Users can create API endpoints in their organizations" ON api_endpoints;
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

DROP POLICY IF EXISTS "Users can update API endpoints they created" ON api_endpoints;
CREATE POLICY "Users can update API endpoints they created"
  ON api_endpoints FOR UPDATE
  TO authenticated
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

-- =====================================================
-- 10. OPTIMIZE RLS POLICIES - ENDPOINT_FIELDS TABLE
-- =====================================================

-- Remove duplicate policy
DROP POLICY IF EXISTS "Users can read endpoint fields from their organizations" ON endpoint_fields;

DROP POLICY IF EXISTS "Users can manage endpoint fields" ON endpoint_fields;
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

-- =====================================================
-- 11. OPTIMIZE RLS POLICIES - DEPLOYMENTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can read deployments from their organizations" ON deployments;
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

DROP POLICY IF EXISTS "Users can create deployments in their organizations" ON deployments;
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

DROP POLICY IF EXISTS "Users can update deployments they created" ON deployments;
CREATE POLICY "Users can update deployments they created"
  ON deployments FOR UPDATE
  TO authenticated
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

-- =====================================================
-- 12. OPTIMIZE RLS POLICIES - API_CALLS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can read API calls from their organizations" ON api_calls;
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

-- =====================================================
-- 13. OPTIMIZE RLS POLICIES - ANALYTICS_EVENTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can read analytics events from their organizations" ON analytics_events;
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

-- =====================================================
-- 14. OPTIMIZE RLS POLICIES - API_KEYS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can read API keys from their organizations" ON api_keys;
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

DROP POLICY IF EXISTS "Users can create API keys in their organizations" ON api_keys;
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

DROP POLICY IF EXISTS "Users can update API keys they created" ON api_keys;
CREATE POLICY "Users can update API keys they created"
  ON api_keys FOR UPDATE
  TO authenticated
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

-- =====================================================
-- 15. OPTIMIZE RLS POLICIES - USAGE_METRICS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can read usage metrics from their organizations" ON usage_metrics;
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

-- =====================================================
-- 16. OPTIMIZE RLS POLICIES - NOTIFICATIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
CREATE POLICY "Users can read their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- 17. OPTIMIZE RLS POLICIES - AUDIT_LOGS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can read audit logs from their organizations" ON audit_logs;
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

-- =====================================================
-- 18. FIX FUNCTION SEARCH PATH
-- =====================================================

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
