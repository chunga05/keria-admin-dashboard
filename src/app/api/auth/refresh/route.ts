import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, signAccessToken, sha256 } from '@/lib/jwt';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const AT_COOKIE = 'dkvn_at';
const RT_COOKIE = 'dkvn_rt';
const REFRESH_TTL_SEC = 7 * 24 * 60 * 60; // 7 ngAy
const GRACE_PERIOD_SEC = 30; // 30s grace period cho xoay vAng

export async function GET(request: NextRequest) {
  return handleRefresh(request);
}

export async function POST(request: NextRequest) {
  return handleRefresh(request);
}

async function handleRefresh(request: NextRequest) {
  try {
    let accessToken = request.cookies.get(AT_COOKIE)?.value;
    const authHeader = request.headers.get('Authorization');
    if (!accessToken && authHeader?.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7).trim();
    }

    const payload = accessToken ? await verifyAccessToken(accessToken).catch(() => null) : null;
    const refreshValue = request.cookies.get(RT_COOKIE)?.value;

    if (!refreshValue) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const tokenHash = await sha256(refreshValue);

    // Kiem tra refresh token
    const { data: record } = await supabaseAdmin
      .from('refresh_token_families')
      .select('id, user_id, family_id, token_hash, revoked_at, grace_until, expires_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (!record || new Date(record.expires_at) < new Date()) {
      const res = NextResponse.json({ error: 'unauthorized' }, { status: 401 });
      res.cookies.delete(AT_COOKIE);
      res.cookies.delete(RT_COOKIE);
      return res;
    }

    let validUserId: string | null = null;

    if (record.revoked_at) {
      // Reuse detected!
      const withinGrace = record.grace_until && new Date(record.grace_until) > new Date();
      if (withinGrace) {
        validUserId = record.user_id;
      } else {
        // Reuse ngoai grace period -> Thu hoi toan bo family
        await supabaseAdmin
          .from('refresh_token_families')
          .update({ revoked_at: new Date().toISOString() })
          .eq('family_id', record.family_id);
        
        const res = NextResponse.json({ error: 'token_compromised' }, { status: 401 });
        res.cookies.delete(AT_COOKIE);
        res.cookies.delete(RT_COOKIE);
        return res;
      }
    } else {
      validUserId = record.user_id;
      // Danh dau da su dung va cap nhat grace period
      const now = new Date();
      const graceUntil = new Date(now.getTime() + GRACE_PERIOD_SEC * 1000);
      await supabaseAdmin
        .from('refresh_token_families')
        .update({ revoked_at: now.toISOString(), grace_until: graceUntil.toISOString() })
        .eq('id', record.id);
    }

    if (!validUserId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // Lay thong tin user va cap phat token moi
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', validUserId)
      .single();

    if (!user || user.status !== 'approved' || user.role !== 'admin') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const newAccessToken = await signAccessToken({
      sub: user.id,
      role: user.role,
      status: user.status,
    });
    const newRefreshValue = crypto.randomUUID();
    const newRefreshHash = await sha256(newRefreshValue);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_SEC * 1000).toISOString();

    await supabaseAdmin
      .from('refresh_token_families')
      .insert({
        user_id: user.id,
        family_id: record.family_id,
        token_hash: newRefreshHash,
        expires_at: expiresAt,
      });

    const isProd = process.env.NODE_ENV === 'production';
    const res = NextResponse.json({ success: true });
    
    res.cookies.set(AT_COOKIE, newAccessToken, {
      httpOnly: false, secure: isProd, sameSite: 'lax', path: '/', maxAge: 15 * 60,
    });
    res.cookies.set(RT_COOKIE, newRefreshValue, {
      httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', maxAge: REFRESH_TTL_SEC,
    });

    return res;
  } catch (err) {
    console.error('[Refresh Auth]', err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
