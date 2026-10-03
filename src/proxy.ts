import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const AT_COOKIE = 'dkvn_at';
const AT_COOKIE_FALLBACK = 'dkvn_admin_at';
const RT_COOKIE = 'dkvn_rt';
const RT_COOKIE_FALLBACK = 'dkvn_admin_rt';

// Cache role ngắn hạn (30 giây) trong memory để tránh quá tải DB nhưng vẫn đảm bảo tính kịp thời
const roleCache = new Map<string, { isAdmin: boolean; expires: number }>();

function getSecret(): Uint8Array {
  const s = process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET || process.env.USER_JWT_SECRET;
  if (!s) {
    console.error('[Admin Middleware] Missing JWT_SECRET environment variable');
    return new TextEncoder().encode('');
  }
  return new TextEncoder().encode(s);
}

/**
 * Ràng buộc bảo mật bắt buộc:
 * 1. Verify chữ ký & hạn dùng của JWT token
 * 2. KHÔNG tin tưởng claim role trong JWT payload
 * 3. Query trực tiếp vào Database để verify role và status thực tế của user
 */
async function verifyAdminAccess(token: string): Promise<{ authorized: boolean; error?: string }> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = payload.sub;
    if (!userId) {
      return { authorized: false, error: 'invalid_token_payload' };
    }

    // 1. Kiểm tra cache role (30 giây TTL)
    const cached = roleCache.get(userId);
    if (cached && cached.expires > Date.now()) {
      return { authorized: cached.isAdmin };
    }

    // 2. Query trực tiếp Database qua Supabase REST API (dùng Service Role Key)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      console.error('[Admin Middleware] Missing Supabase URL or Service Role Key');
      return { authorized: false, error: 'missing_db_credentials' };
    }

    const dbRes = await fetch(
      `${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(userId)}&select=role,status&limit=1`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          Accept: 'application/json',
        },
        cache: 'no-store', // Không dùng Next.js fetch cache để đảm bảo dữ liệu mới nhất
      }
    );

    if (!dbRes.ok) {
      roleCache.set(userId, { isAdmin: false, expires: Date.now() + 10_000 });
      return { authorized: false, error: 'db_query_failed' };
    }

    const data = (await dbRes.json()) as Array<{ role: string; status: string }>;
    const userRecord = data[0];

    // Bắt buộc role phải là 'admin' VÀ status phải là 'approved'
    const isAdmin =
      !!userRecord &&
      String(userRecord.role).trim().toLowerCase() === 'admin' &&
      String(userRecord.status).trim().toLowerCase() === 'approved';

    // Lưu cache 30s
    roleCache.set(userId, { isAdmin, expires: Date.now() + 30_000 });

    return { authorized: isAdmin };
  } catch (err: any) {
    return { authorized: false, error: err?.message || 'verification_failed' };
  }
}

// Các path công khai DUY NHẤT (không được đưa '/' vào đây!)
const PUBLIC_PATHS = [
  '/auth/receive', // Trang nhận token nếu chuyển hướng từ origin khác
  '/api/auth/',    // Các API phục vụ xác thực
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cho phép các static files và public paths
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p));
  if (isPublic) {
    return NextResponse.next();
  }

  // URL của trang Login chung (ở user web)
  const userBaseUrl = process.env.NEXT_PUBLIC_USER_URL || 'http://localhost:3000';
  const loginUrl = new URL('/login', userBaseUrl);

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const host = forwardedHost || request.headers.get('host');
  const adminBaseUrl = process.env.NEXT_PUBLIC_ADMIN_URL;

  let currentUrl = request.url;
  if (currentUrl.includes('0.0.0.0')) {
    if (adminBaseUrl && !adminBaseUrl.includes('0.0.0.0')) {
      const parsed = new URL(request.url);
      currentUrl = `${adminBaseUrl.replace(/\/$/, '')}${parsed.pathname}${parsed.search}`;
    } else if (host && !host.includes('0.0.0.0')) {
      const parsed = new URL(request.url);
      currentUrl = `${forwardedProto}://${host}${parsed.pathname}${parsed.search}`;
    }
  }

  loginUrl.searchParams.set('next', currentUrl);

  // Lấy Access Token từ cookie (ưu tiên dkvn_at, fallback dkvn_admin_at) hoặc Authorization header
  let token =
    request.cookies.get(AT_COOKIE)?.value ||
    request.cookies.get(AT_COOKIE_FALLBACK)?.value;

  const authHeader = request.headers.get('Authorization');
  if (!token && authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  const refreshToken =
    request.cookies.get(RT_COOKIE)?.value ||
    request.cookies.get(RT_COOKIE_FALLBACK)?.value;

  // 1. Nếu không có token nào cả -> Chuyển hướng sang trang Login chung
  if (!token && !refreshToken) {
    return NextResponse.redirect(loginUrl);
  }

  // 2. Nếu có access token -> Verify chữ ký và Query DB để kiểm tra role thực tế
  if (token) {
    const { authorized } = await verifyAdminAccess(token);

    if (authorized) {
      return NextResponse.next();
    }
  }

  // 3. Nếu token không hợp lệ hoặc đã hết hạn, nhưng có refresh token ->
  // Thử refresh hoặc chuyển hướng về login
  const redirectResponse = NextResponse.redirect(loginUrl);
  redirectResponse.cookies.delete(AT_COOKIE);
  redirectResponse.cookies.delete(AT_COOKIE_FALLBACK);
  return redirectResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, icons, fonts static folders
     */
    '/((?!_next/static|_next/image|favicon.ico|images|icons|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
