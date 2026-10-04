import { NextRequest, NextResponse } from 'next/server';
import { sha256 } from '@/lib/jwt';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const AT_COOKIE = 'dkvn_at';
const RT_COOKIE = 'dkvn_rt';

export async function POST(request: NextRequest) {
  try {
    const refreshValue = request.cookies.get(RT_COOKIE)?.value;
    
    if (refreshValue) {
      const tokenHash = await sha256(refreshValue);
      const { data: record } = await supabaseAdmin
        .from('refresh_token_families')
        .select('family_id')
        .eq('token_hash', tokenHash)
        .maybeSingle();
        
      if (record) {
        await supabaseAdmin
          .from('refresh_token_families')
          .update({ revoked_at: new Date().toISOString() })
          .eq('family_id', record.family_id);
      }
    }
  } catch (err) {
    console.error('[Logout] Error during DB revocation:', err);
  }

  const res = NextResponse.json({ success: true });
  res.cookies.delete(AT_COOKIE);
  res.cookies.delete(RT_COOKIE);
  return res;
}
