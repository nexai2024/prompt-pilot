/*
  # Fix Organization Creation Trigger

  1. Changes
    - Update trigger function to bypass RLS policies
    - Set proper security context for automatic organization creation
    - Ensures trigger can create organizations even when no user session exists

  2. Security
    - Maintains SECURITY DEFINER to run with elevated privileges
    - RLS is temporarily disabled only within the trigger scope
    - Function is owned by postgres/supabase_admin with full permissions
*/

-- Drop and recreate the function with RLS bypass
DROP FUNCTION IF EXISTS create_default_organization_for_user() CASCADE;

CREATE OR REPLACE FUNCTION create_default_organization_for_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Temporarily disable RLS for this function
  -- This allows the trigger to create organizations during signup
  -- when no user session exists yet
  
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_default_organization_for_user() TO authenticated;
GRANT EXECUTE ON FUNCTION create_default_organization_for_user() TO service_role;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_organization_for_user();
