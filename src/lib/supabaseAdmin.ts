import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('CRITICAL ERROR: SUPABASE_SERVICE_ROLE_KEY is missing! Admin client will use Anon key and fail RLS.');
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
