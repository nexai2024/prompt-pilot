# Login Debugging Guide

## Overview
The authentication system now includes comprehensive error handling and debugging capabilities to help diagnose login issues.

## Enhanced Features

### 1. Detailed Console Logging
All authentication operations now log detailed information to the browser console:

**Sign In Logs:**
```
=== SIGN IN ATTEMPT ===
Email: user@example.com
Time: 2024-01-15T10:30:00.000Z

Sign in response: {
  hasData: true,
  hasUser: true,
  hasSession: true,
  error: null
}

Sign in successful! Duration: 234ms
```

**Error Logs:**
```
=== SIGN IN FAILED ===
Error: [Full error object]
Message: Invalid email or password
Duration: 156ms
```

### 2. On-Screen Debug Information
When a login fails, a debug panel automatically appears showing:
- Supabase configuration status
- Last attempt timestamp
- Request duration
- Error details (name, status, message)
- Link to browser console for full logs

### 3. User-Friendly Error Messages
Common Supabase errors are mapped to clear, actionable messages:

| Supabase Error | User Message |
|----------------|--------------|
| "Invalid login credentials" | "Invalid email or password. Please check your credentials and try again." |
| "Email not confirmed" | "Please confirm your email address before signing in." |
| "User not found" | "No account found with this email address." |
| "Invalid email" | "Please enter a valid email address." |
| Rate limit (429) | "Too many attempts. Please wait a moment and try again." |
| Server error (500) | "Server error. Please try again later." |

### 4. Supabase Client Initialization Checks
The app now validates Supabase configuration on startup:
```
Supabase Configuration: {
  hasUrl: true,
  hasKey: true,
  url: "https://wjewdlokdkubamgiwp...",
  keyPrefix: "eyJhbGciOiJIUzI1NiI..."
}

Supabase client initialized successfully
```

## How to Debug Login Issues

### Step 1: Open Browser Developer Tools
1. Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
2. Go to the **Console** tab

### Step 2: Attempt to Sign In
1. Enter your credentials
2. Click "Sign In"
3. Watch for console logs

### Step 3: Check Debug Information
If login fails, check:

**In the UI:**
- Red error alert with user-friendly message
- Blue debug panel with technical details

**In the Console:**
- Configuration status
- Full error object
- Network requests (Network tab)

### Step 4: Common Issues and Solutions

#### Issue: "Invalid email or password"
**Possible Causes:**
- Wrong email or password
- Account doesn't exist
- Password reset required

**Solutions:**
1. Verify email is correct
2. Try "Forgot password?"
3. Create a new account if needed

#### Issue: "Email not confirmed"
**Cause:** Supabase email confirmation is enabled

**Solution:**
1. Check your email for confirmation link
2. Click the confirmation link
3. Try signing in again

**Note:** Email confirmation is typically disabled in this setup, but can be enabled in Supabase dashboard

#### Issue: Supabase client not initialized
**Error in Console:**
```
CRITICAL: Supabase environment variables are not set!
```

**Solution:**
1. Check `.env` file exists
2. Verify these variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Restart the development server

#### Issue: Network errors
**Check Network Tab:**
1. Open Network tab in DevTools
2. Filter by "Fetch/XHR"
3. Look for failed requests to Supabase
4. Check response status and body

**Common Network Issues:**
- CORS errors → Check Supabase configuration
- 401 Unauthorized → Invalid API key
- 403 Forbidden → RLS policy blocking access
- 500 Server Error → Database or server issue

### Step 5: Database Verification

If authentication succeeds but profile loading fails:

1. Check console for profile errors
2. Verify database tables exist:
   - `profiles`
   - `organizations`
   - `organization_members`

3. Check RLS policies are set correctly
4. Verify user exists in `auth.users` table

## Testing Authentication

### Create Test Account
1. Go to `/auth/sign-up`
2. Fill in all required fields
3. Submit form
4. Check console for detailed logs
5. Should redirect to `/dashboard` on success

### Test Sign In
1. Go to `/auth/sign-in`
2. Enter test account credentials
3. Submit form
4. Check console and debug panel
5. Should redirect to `/dashboard` on success

### Verify Session Persistence
1. Sign in successfully
2. Refresh the page
3. Should remain signed in
4. Check console for "getCurrentUser" logs

## Advanced Debugging

### Enable Verbose Logging
All auth operations log to console. To see even more:

```javascript
// In browser console
localStorage.debug = 'supabase:*'
```

### Check Supabase Auth State
```javascript
// In browser console
supabase.auth.getSession().then(console.log)
supabase.auth.getUser().then(console.log)
```

### Check Local Storage
```javascript
// In browser console
Object.keys(localStorage).filter(k => k.includes('supabase'))
```

### Manual Test Database Connection
```javascript
// In browser console
supabase.from('profiles').select('*').limit(1).then(console.log)
```

## Getting Help

When reporting login issues, include:

1. **Error message** from the UI
2. **Console logs** (screenshot or copy)
3. **Debug panel info** (screenshot)
4. **Network tab** response (if applicable)
5. **Steps to reproduce** the issue

## Configuration Files

**Environment Variables:** `.env`
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Auth Configuration:** `lib/auth.ts`
- Sign in/up logic
- Error message mapping
- Profile management

**Supabase Client:** `lib/supabase.ts`
- Client initialization
- Configuration validation
- Auth settings

**Auth Hook:** `lib/hooks/useAuth.tsx`
- Auth state management
- User context
- Auth state listener

## Success Indicators

**Successful Sign In:**
1. Console: "Sign in successful! Duration: XXXms"
2. No error alerts shown
3. Redirect to `/dashboard`
4. User profile loads
5. Navigation menu shows user info

**Successful Sign Up:**
1. Console: "Sign up successful! Duration: XXXms"
2. Profile created in database
3. Default organization created
4. Redirect to `/dashboard`
5. Welcome experience starts

## Known Limitations

1. **Email Confirmation:** Currently disabled for easier testing
2. **Password Reset:** Requires email service configuration
3. **OAuth Providers:** Not configured (email/password only)
4. **MFA:** Not enabled by default

## Next Steps

After successful authentication:
1. User is redirected to `/dashboard`
2. Profile and organization data loaded
3. Auth state persists across refreshes
4. Protected routes are accessible
5. API calls include authentication

## Support Checklist

Before asking for help, verify:
- [ ] Supabase environment variables are set
- [ ] Browser console shows no configuration errors
- [ ] Network requests to Supabase are successful (200 status)
- [ ] Database tables exist (profiles, organizations, etc.)
- [ ] RLS policies are correctly configured
- [ ] Using valid email format
- [ ] Password meets minimum requirements (8+ characters)
- [ ] Browser allows cookies and local storage
- [ ] No ad blockers interfering with requests
