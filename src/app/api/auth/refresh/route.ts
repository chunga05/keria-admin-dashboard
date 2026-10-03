import { NextRequest, NextResponse } from 'next/server';
import { signAccessToken, sha256 } from '@/lib/jwt';
import { supabaseAdmin } from '@/lib/supabaseClient';

const AT_COOKIE = 'dkvn_at';
const AT_COOKIE_FALLBACK = 'dkvn_admin_at';
const RT_COOKIE = 'dkvn_rt';
const RT_COOKIE_FALLBACK = 'dkvn_admin_rt';
const REFRESH_TTL_SEC = 7 * 24 * 60 * 60;
const GRACE_PERIOD_SEC = 30;

function clearAuthCookies(res: NextResponse): NextResponse {
  res.cookies.delete(AT_COOKIE);
  res.cookies.delete(AT_COOKIE_FALLBACK);
  res.cookies.delete(RT_COOKIE);
  res.cookies.delete(RT_COOKIE_FALLBACK);
  return res;
}

export async function POST(request: NextRequest) {
  try {
    const refreshValue =
      request.cookies.get(RT_COOKIE)?.value ||
      request.cookies.get(RT_COOKIE_FALLBACK)?.value;

    if (!refreshValue) {
      return NextResponse.json({ error: 'no_refresh_token' }, { status: 401 });
    }

    const tokenHash = await sha256(refreshValue);

    const { data: record, error: lookupErr } = await supabaseAdmin
      .from('refresh_token_families')
      .select('id, user_id, family_id, token_hash, revoked_at, grace_until, expires_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (lookupErr || !record) {
      return clearAuthCookies(
        NextResponse.json({ error: 'invalid_token' }, { status: 401 })
      );
    }

    if (new Date(record.expires_at) < new Date()) {
      return clearAuthCookies(
        NextResponse.json({ error: 'token_expired' }, { status: 401 })
      );
    }

    // Xử lý token đã bị revoked
    if (record.revoked_at) {
      const withinGrace =
        record.grace_until && new Date(record.grace_until) > new Date();

      if (withinGrace) {
        // Race condition grace: cấp lại access token cho các request đồng thời
        const { data: profile } = await supabaseAdmin
          .from('users')
          .select('role, status')
          .eq('id', record.user_id)
          .maybeSingle();

        if (
          profile &&
          String(profile.role).trim().toLowerCase() === 'admin' &&
          String(profile.status).trim().toLowerCase() === 'approved'
        ) {
          const at = await signAccessToken({
            sub: record.user_id,
            role: 'admin',
            status: 'approved',
          });
          const gracRes = NextResponse.json({ access_token: at });
          gracRes.cookies.set(AT_COOKIE, at, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60,
            path: '/',
          });
          gracRes.cookies.set(AT_COOKIE_FALLBACK, at, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60,
            path: '/',
          });
          return gracRes;
        }
      }

      // REUSE DETECTED: Thu hồi toàn bộ token family của user ngay lập tức!
      await supabaseAdmin
        .from('refresh_token_families')
        .update({ revoked_at: new Date().toISOString() })
        .eq('family_id', record.family_id)
        .is('revoked_at', null);

      return clearAuthCookies(
        NextResponse.json({ error: 'token_reuse_detected' }, { status: 401 })
      );
    }

    // Token hợp lệ — Verify lại role & status thực tế trong Database (bắt buộc)
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role, status')
      .eq('id', record.user_id)
      .maybeSingle();

    if (
      !profile ||
      String(profile.role).trim().toLowerCase() !== 'admin' ||
      String(profile.status).trim().toLowerCase() !== 'approved'
    ) {
      // User đã bị hạ quyền hoặc khoá tài khoản -> thu hồi token
      await supabaseAdmin
        .from('refresh_token_families')
        .update({ revoked_at: new Date().toISOString() })
        .eq('family_id', record.family_id)
        .is('revoked_at', null);

      return clearAuthCookies(
        NextResponse.json({ error: 'role_revoked' }, { status: 403 })
      );
    }

    // Thu hồi token cũ và đặt grace period 30 giây
    const now = new Date();
    const graceUntil = new Date(now.getTime() + GRACE_PERIOD_SEC * 1000);
    await supabaseAdmin
      .from('refresh_token_families')
      .update({ revoked_at: now.toISOString(), grace_until: graceUntil.toISOString() })
      .eq('token_hash', tokenHash);

    // Cấp refresh token mới
    const newRefreshValue = crypto.randomUUID();
    const newHash = await sha256(newRefreshValue);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_SEC * 1000).toISOString();

    await supabaseAdmin.from('refresh_token_families').insert({
      user_id: record.user_id,
      family_id: record.family_id,
      token_hash: newHash,
      parent_hash: tokenHash,
      expires_at: expiresAt,
    });

    // Cấp access token mới
    const newAT = await signAccessToken({
      sub: record.user_id,
      role: 'admin',
      status: 'approved',
    });

    const res = NextResponse.json({ access_token: newAT });
    res.cookies.set(AT_COOKIE, newAT, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    });
    res.cookies.set(AT_COOKIE_FALLBACK, newAT, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    });

    res.cookies.set(RT_COOKIE, newRefreshValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_TTL_SEC,
      path: '/',
    });
    res.cookies.set(RT_COOKIE_FALLBACK, newRefreshValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_TTL_SEC,
      path: '/',
    });

    return res;
  } catch (err) {
    console.error('[POST /api/auth/refresh admin]', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
