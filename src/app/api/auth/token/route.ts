import { NextRequest, NextResponse } from 'next/server';
import { signAccessToken, verifyAccessToken, sha256 } from '@/lib/jwt';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const AT_COOKIE = 'dkvn_at';
const AT_COOKIE_FALLBACK = 'dkvn_admin_at';
const RT_COOKIE = 'dkvn_rt';
const RT_COOKIE_FALLBACK = 'dkvn_admin_rt';
const REFRESH_TTL_SEC = 7 * 24 * 60 * 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const incomingToken: string | undefined = body?.access_token || body?.supabase_access_token;

    if (!incomingToken) {
      return NextResponse.json({ error: 'missing_token' }, { status: 400 });
    }

    let userId: string | null = null;

    // 1. Thử verify như custom JWT của hệ thống
    const jwtPayload = await verifyAccessToken(incomingToken);
    if (jwtPayload?.sub) {
      userId = jwtPayload.sub;
    } else {
      // 2. Fallback: Thử verify như Supabase access token
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(incomingToken);
      if (!authError && user?.id) {
        userId = user.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
    }

    // 3. Query ACTUAL role & status từ Database — Tuyệt đối không chỉ tin JWT payload
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role, status')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'profile_not_found' }, { status: 403 });
    }

    // Kiểm tra quyền Admin
    if (String(profile.role).trim().toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'role_not_admin' }, { status: 403 });
    }
    if (String(profile.status).trim().toLowerCase() !== 'approved') {
      return NextResponse.json({ error: 'status_not_approved' }, { status: 403 });
    }

    // Issue access token (15 min)
    const accessToken = await signAccessToken({
      sub: userId,
      role: 'admin',
      status: 'approved',
    });

    // Issue refresh token (7 days) & lưu hash vào DB
    const refreshValue = crypto.randomUUID();
    const familyId = crypto.randomUUID();
    const tokenHash = await sha256(refreshValue);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_SEC * 1000).toISOString();

    await supabaseAdmin.from('refresh_token_families').insert({
      user_id: userId,
      family_id: familyId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    const res = NextResponse.json({ access_token: accessToken });

    const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

    // Set cookie dkvn_at
    res.cookies.set(AT_COOKIE, accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
      domain: cookieDomain,
    });
    res.cookies.set(AT_COOKIE_FALLBACK, accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
      domain: cookieDomain,
    });

    // Set cookie dkvn_rt
    res.cookies.set(RT_COOKIE, refreshValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_TTL_SEC,
      path: '/',
      domain: cookieDomain,
    });
    res.cookies.set(RT_COOKIE_FALLBACK, refreshValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_TTL_SEC,
      path: '/',
      domain: cookieDomain,
    });

    return res;
  } catch (err) {
    console.error('[POST /api/auth/token admin]', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

