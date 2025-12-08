/*
  # Create Default Organization for Users

  1. New Changes
    - Add function to create default organization for new users
    - Add trigger to automatically create organization on user signup
    - Add default organization member entry

  2. Security
    - Maintains existing RLS policies
*/

-- Function to create default organization for new user
CREATE OR REPLACE FUNCTION create_default_organization_for_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Create a personal organization for the new user
  INSERT INTO organizations (name, slug, created_by)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Personal') || '''s Organization',
    'personal-' || NEW.id::text,
    NEW.id
  )
  RETURNING id INTO new_org_id;

  -- Add user as owner of the organization
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default organization on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_organization_for_user();

-- Create default organizations for existing users who don't have one
DO $$
DECLARE
  user_record RECORD;
  new_org_id uuid;
BEGIN
  FOR user_record IN
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN organization_members om ON u.id = om.user_id
    WHERE om.user_id IS NULL
  LOOP
    -- Create organization
    INSERT INTO organizations (name, slug, created_by)
    VALUES (
      COALESCE(user_record.raw_user_meta_data->>'first_name', 'Personal') || '''s Organization',
      'personal-' || user_record.id::text,
      user_record.id
    )
    RETURNING id INTO new_org_id;

    -- Add as owner
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (new_org_id, user_record.id, 'owner');
  END LOOP;
END $$;
