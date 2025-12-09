# Supabase Setup Guide

Complete guide to initialize a new Supabase instance for the Prompt Pilot application.

## Quick Start

### Option 1: Using the Initialization Script (Recommended)

1. **Create a Supabase Project**
   - Go to [https://supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose a name, database password, and region
   - Wait for project to be created (~2 minutes)

2. **Run the Initialization Script**
   - Open your Supabase project dashboard
   - Go to **SQL Editor** (left sidebar)
   - Click "New Query"
   - Copy the entire contents of `supabase-init.sql`
   - Paste into the SQL Editor
   - Click **Run** (or press Cmd/Ctrl + Enter)
   - Wait for execution to complete

3. **Verify Setup**
   - Go to **Table Editor** (left sidebar)
   - You should see all tables: profiles, organizations, prompts, etc.
   - Go to **Database** > **Triggers**
   - Verify `on_auth_user_created` trigger exists

4. **Get Your Credentials**
   - Go to **Project Settings** (gear icon)
   - Click **API** section
   - Copy:
     - **Project URL** (under "Project URL")
     - **anon public** key (under "Project API keys")

5. **Configure Your Application**
   ```bash
   # Update your .env file
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

6. **Start the Application**
   ```bash
   npm install
   npm run dev
   ```

7. **Create Your First Account**
   - Navigate to `http://localhost:3000/auth/sign-up`
   - Fill in your details
   - Submit the form
   - A default organization will be created automatically!

---

### Option 2: Using Supabase CLI

If you prefer using the command line:

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link Your Project**
   ```bash
   supabase link --project-ref your-project-id
   ```

4. **Apply Migrations**
   ```bash
   supabase db push
   ```

---

## What Gets Created

### Tables (17 total)

1. **profiles** - User profile information
2. **organizations** - Organizations/teams
3. **organization_members** - User-organization relationships
4. **billing_plans** - Available subscription plans
5. **subscriptions** - Organization subscriptions
6. **prompts** - AI prompts created by users
7. **prompt_versions** - Version history for prompts
8. **prompt_variables** - Variables defined in prompts
9. **api_endpoints** - API endpoints designed by users
10. **endpoint_fields** - Request/response schemas for endpoints
11. **deployments** - Deployed API instances
12. **api_calls** - Log of API calls
13. **analytics_events** - Analytics and tracking events
14. **api_keys** - API keys for authentication
15. **usage_metrics** - Usage tracking for billing
16. **notifications** - User notifications
17. **audit_logs** - Audit trail for important actions

### Security Features

- **Row Level Security (RLS)** enabled on all tables
- **40+ security policies** to control data access
- **Optimized policies** using `(select auth.uid())` for performance
- **Role-based access** (owner, admin, developer, viewer)
- **Organization-based isolation** - users only see their org's data

### Automatic Features

- **Auto-timestamps** - `created_at` and `updated_at` automatically managed
- **Auto-organization** - Every new user gets a personal organization
- **Performance indexes** - 50+ indexes on foreign keys and common queries
- **Billing plans** - 3 pre-configured plans (Starter, Professional, Enterprise)

### Functions and Triggers

1. **update_updated_at_column()** - Updates `updated_at` timestamp
2. **create_default_organization_for_user()** - Creates organization on signup
3. **on_auth_user_created** - Trigger that runs on new user signup

---

## Verifying Your Setup

### 1. Check Tables
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Should return 17 tables.

### 2. Check RLS Policies
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Should return 40+ policies.

### 3. Check Triggers
```sql
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

Should return 7+ triggers.

### 4. Check Billing Plans
```sql
SELECT name, price_monthly, max_apis
FROM billing_plans
WHERE is_active = true;
```

Should return 3 plans: Starter, Professional, Enterprise.

---

## Testing Authentication

### Create a Test User

1. **Sign Up**
   - Go to `/auth/sign-up`
   - Enter:
     - First Name: Test
     - Last Name: User
     - Email: test@example.com
     - Password: testpassword123
     - Company: Test Company (optional)
   - Click "Create Account"

2. **Verify in Supabase**
   - Go to **Authentication** > **Users**
   - You should see your new user
   - Go to **Table Editor** > **profiles**
   - You should see the profile record
   - Go to **organizations**
   - You should see "Test's Organization"
   - Go to **organization_members**
   - You should see the membership with role = 'owner'

3. **Sign In**
   - Go to `/auth/sign-in`
   - Enter credentials
   - Should redirect to `/dashboard`

---

## Common Issues

### Issue: Script fails with "permission denied"

**Solution:** Make sure you're running the script as the postgres user. The script includes `SECURITY DEFINER` which should handle this, but if it fails:

```sql
-- Run as postgres user
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
```

### Issue: "auth.users does not exist"

**Cause:** You're trying to create a Supabase project without authentication enabled.

**Solution:** Authentication is enabled by default in all Supabase projects. Make sure you're using a valid Supabase project, not a raw PostgreSQL database.

### Issue: Trigger doesn't create organization

**Check:**
```sql
-- Verify trigger exists
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check function exists
SELECT * FROM pg_proc WHERE proname = 'create_default_organization_for_user';

-- Test function manually
SELECT create_default_organization_for_user();
```

**Re-create trigger:**
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_organization_for_user();
```

### Issue: RLS policies blocking access

**Debug RLS:**
```sql
-- Temporarily disable RLS for testing (DON'T DO IN PRODUCTION)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Check which policy is blocking
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub = 'user-uuid-here';
SELECT * FROM profiles;  -- Should now work
```

**Fix:** Make sure your policies use `(select auth.uid())` instead of `auth.uid()` for better performance and reliability.

---

## Maintenance

### Backup Your Database

```bash
# Using Supabase CLI
supabase db dump -f backup.sql

# Or from dashboard: Database > Backups > Download
```

### Reset Database (Danger!)

```bash
# This will delete ALL data!
supabase db reset
```

### View Logs

```bash
supabase functions logs
```

---

## Security Best Practices

1. **Never share your service_role key** - Only use anon key in client
2. **Always use RLS policies** - Never disable RLS in production
3. **Validate all inputs** - Even with RLS, validate data
4. **Use prepared statements** - Prevent SQL injection
5. **Rotate API keys** - Regularly rotate your Supabase keys
6. **Monitor auth logs** - Check for suspicious activity
7. **Enable MFA** - Add multi-factor authentication for admin users

---

## Next Steps

After successful setup:

1. **Customize Billing Plans** - Update prices and features in `billing_plans` table
2. **Configure Email** - Set up email templates in Supabase Auth settings
3. **Add OAuth Providers** - Enable Google, GitHub, etc. in Auth settings
4. **Set up Storage** - Create buckets for user avatars and files
5. **Configure Edge Functions** - Deploy serverless functions for webhooks
6. **Enable Realtime** - Turn on realtime for live updates
7. **Set up Backups** - Schedule automatic backups

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## Support

If you encounter issues:

1. Check `LOGIN_DEBUG_GUIDE.md` for authentication issues
2. Check `SECURITY_FIXES.md` for security-related problems
3. Review Supabase logs in the dashboard
4. Check browser console for detailed error messages
5. Enable verbose logging (see LOGIN_DEBUG_GUIDE.md)

---

## Summary Checklist

- [ ] Created Supabase project
- [ ] Ran `supabase-init.sql` script
- [ ] Verified all 17 tables exist
- [ ] Verified RLS policies (40+)
- [ ] Verified triggers (7+)
- [ ] Copied Supabase URL and anon key
- [ ] Updated `.env` file
- [ ] Started application
- [ ] Created test account
- [ ] Verified auto-organization creation
- [ ] Successfully logged in
- [ ] Accessed dashboard

If all items are checked, you're ready to go! 🚀
