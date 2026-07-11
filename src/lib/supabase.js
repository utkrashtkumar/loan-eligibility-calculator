import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Security (F14): Explicit auth config.
// Sessions are stored in localStorage by default (required for client components).
// Note: For stronger XSS token protection in a future hardening pass, consider
// switching to sessionStorage or httpOnly cookies via a custom storage adapter.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'h2h-auth-token', // Named key avoids generic 'sb-*' token discovery
  }
});
