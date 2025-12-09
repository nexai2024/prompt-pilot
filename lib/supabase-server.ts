import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from './supabase';

export function createServerClient() {
  return createRouteHandlerClient<Database>({ cookies });
}
