import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sha256 } from '@/lib/jwt';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const AT_COOKIE = 'dkvn_at';
const AT_COOKIE_FALLBACK = 'dkvn_admin_at';
const RT_COOKIE = 'dkvn_rt';
const RT_COOKIE_FALLBACK = 'dkvn_admin_rt';

export async function POST(request: NextRequest) {
  const refreshValue =
    request.cookies.get(RT_COOKIE)?.value ||
    request.cookies.get(RT_COOKIE_FALLBACK)?.value;

  if (refreshValue) {
    try {
      const tokenHash = await sha256(refreshValue);
      const { data: record } = await supabaseAdmin
        .from('refresh_token_families')
        .select('family_id')
        .eq('token_hash', tokenHash)
        .maybeSingle();

      if (record?.family_id) {
        await supabaseAdmin
          .from('refresh_token_families')
          .update({ revoked_at: new Date().toISOString() })
          .eq('family_id', record.family_id)
          .is('revoked_at', null);
      }
    } catch (err) {
      console.error('[admin logout] Error revoking:', err);
    }
  }

  const res = NextResponse.json({ success: true });
  res.cookies.delete(AT_COOKIE);
  res.cookies.delete(AT_COOKIE_FALLBACK);
  res.cookies.delete(RT_COOKIE);
  res.cookies.delete(RT_COOKIE_FALLBACK);
  return res;
}
