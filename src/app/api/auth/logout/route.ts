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

  const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

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
          .update({
            revoked_at: new Date().toISOString(),
            grace_until: new Date(0).toISOString(),
          })
          .eq('family_id', record.family_id);
      }
    } catch (err) {
      console.error('[admin logout] Error revoking:', err);
    }
  }

  const res = NextResponse.json({ success: true });
  const cookiesToClear = [AT_COOKIE, AT_COOKIE_FALLBACK, RT_COOKIE, RT_COOKIE_FALLBACK];

  cookiesToClear.forEach((name) => {
    res.cookies.set(name, '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      httpOnly: name.includes('rt'),
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    res.cookies.delete(name);

    if (cookieDomain) {
      res.cookies.set(name, '', {
        path: '/',
        domain: cookieDomain,
        maxAge: 0,
        expires: new Date(0),
        httpOnly: name.includes('rt'),
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
      res.cookies.delete({ name, domain: cookieDomain, path: '/' });
    }
  });

  return res;
}
