import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { signAccessToken, sha256, verifyAccessToken } from '@/lib/jwt';

const AT_COOKIE = 'dkvn_at';
const RT_COOKIE = 'dkvn_rt';
const REFRESH_TTL_SEC = 7 * 24 * 60 * 60; // 7 ngay

export async function POST(request: NextRequest) {
  try {
    const { access_token } = await request.json();
    if (!access_token) {
      return NextResponse.json({ error: 'missing_token' }, { status: 400 });
    }

    const payload = await verifyAccessToken(access_token);
    
    if (!payload || !payload.sub) {
      console.error('[Token Auth] Custom JWT verify failed');
      return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
    }

    const userId = payload.sub;

    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (dbError) {
      console.error('[Token Auth] DB error:', dbError);
      return NextResponse.json({ error: 'internal_error' }, { status: 500 });
    }
    
    if (!dbUser) {
      return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
    }

    if (dbUser.role !== 'admin') {
      return NextResponse.json({ error: 'role_not_admin' }, { status: 403 });
    }
    
    if (dbUser.status !== 'approved') {
      return NextResponse.json({ error: 'status_not_approved' }, { status: 403 });
    }

    const customAccessToken = await signAccessToken({
      sub: dbUser.id,
      role: dbUser.role,
      status: dbUser.status,
    });
    const refreshValue = crypto.randomUUID();
    const tokenHash = await sha256(refreshValue);
    const familyId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + REFRESH_TTL_SEC * 1000).toISOString();

    await supabaseAdmin
      .from('refresh_token_families')
      .insert({
        user_id: dbUser.id,
        family_id: familyId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });

    const isProd = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({ success: true, access_token: customAccessToken });

    response.cookies.set(AT_COOKIE, customAccessToken, {
      httpOnly: false, secure: isProd, sameSite: 'lax', path: '/', maxAge: 15 * 60,
    });
    response.cookies.set(RT_COOKIE, refreshValue, {
      httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', maxAge: REFRESH_TTL_SEC,
    });

    return response;

  } catch (err) {
    console.error('[Token Auth] Exception:', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
