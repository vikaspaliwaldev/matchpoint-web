import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pcfwdibqnpvikdntgypw.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Smart fallback checker:
// If NEXT_PUBLIC_SUPABASE_ANON_KEY is empty, the service layer will run in in-memory Mock Mode.
// The moment the user drops in their Supabase API Key, the app dynamically switches to Database Mode!
export const isSupabaseConfigured = !!supabaseAnonKey && supabaseAnonKey !== 'your-anon-key-here';

if (!isSupabaseConfigured) {
  console.warn(
    'MatchPoint: Supabase Anon Key is not configured yet. The app is running in in-memory Mock Mode. ' +
    'Add NEXT_PUBLIC_SUPABASE_ANON_KEY to your app/.env.local to activate the Supabase backend.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey || 'dummy-key-to-prevent-sdk-error');
