import { NextRequest, NextResponse } from 'next/server';
import { sha256 } from '@/lib/jwt';
import { supabaseAdmin } from '@/lib/supabaseClient';

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
