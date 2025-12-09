import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from './supabase';

export function createBrowserClient() {
  return createClientComponentClient<Database>();
}

export const supabaseBrowser = createBrowserClient();
