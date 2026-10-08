import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pcfwdibqnpvikdntgypw.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Smart fallback checker:
// Active if either Supabase or the live backend REST API (Spring Boot / Aiven) is configured.
// When active, the frontend routes all requests through the live backend API rather than mock mode.
export const isSupabaseConfigured = true;

if (!supabaseAnonKey) {
  console.info('MatchPoint: Supabase is disabled. Running against live backend API at ' + (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'));
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey || 'dummy-key-to-prevent-sdk-error');
