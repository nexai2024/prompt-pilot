import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

/**
 * Creates a Supabase client for server-side use with Clerk authentication.
 * Uses service role key to bypass RLS since Clerk JWTs aren't recognized by Supabase RLS.
 * User authentication is still validated via Clerk before using this client.
 */
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // If service role key is available, use it (bypasses RLS - safe for server-side with Clerk auth)
  if (serviceRoleKey) {
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  
  // Fallback to anon key with Clerk token (may have RLS issues)
  console.warn('SUPABASE_SERVICE_ROLE_KEY not found, using anon key. RLS policies may block requests.');
  return createClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
      async accessToken() {
        const { getToken } = await auth()
        return await getToken() ?? null
      },
    }
  );
}