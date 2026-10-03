'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { tokenStore } from '@/lib/tokenStore';

export default function ReceiveAuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isProcessing = useRef(false);

  useEffect(() => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    let mounted = true;

    const init = async () => {
      try {
        // Extract Supabase access token from URL hash (implicit OAuth flow)
        const hash = window.location.hash.startsWith('#')
          ? window.location.hash.substring(1)
          : window.location.hash;
        const params = new URLSearchParams(hash);
        let supabaseAccessToken = params.get('access_token');

        // Fallback: query string
        if (!supabaseAccessToken) {
          const qp = new URLSearchParams(window.location.search);
          supabaseAccessToken = qp.get('access_token');
        }

        if (!supabaseAccessToken) {
          if (mounted) {
            setErrorMsg('Không tìm thấy thông tin đăng nhập. Vui lòng thử lại.');
            setLoading(false);
          }
          return;
        }

        // Clean token from URL immediately
        window.history.replaceState(null, '', window.location.pathname);

        // Exchange token for our custom admin JWT & set cookies
        const res = await fetch('/api/auth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            access_token: supabaseAccessToken,
            supabase_access_token: supabaseAccessToken,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: 'unknown' }));
          let msg = 'Không thể xác thực. Vui lòng đăng nhập lại.';
          if (body.error === 'role_not_admin') msg = 'Tài khoản này không có quyền quản trị.';
          else if (body.error === 'status_not_approved') msg = 'Tài khoản chưa được phê duyệt hoặc đã bị khoá.';
          if (mounted) { setErrorMsg(msg); setLoading(false); }
          return;
        }

        const { access_token } = await res.json();
        tokenStore.set(access_token);

        if (mounted) {
          setLoading(false);
          router.replace('/');
        }
      } catch (err) {
        console.error('[ReceiveAuth]', err);
        if (mounted) {
          setErrorMsg('Đã xảy ra lỗi trong quá trình đăng nhập.');
          setLoading(false);
        }
      }
    };

    init();
    return () => { mounted = false; };
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4">
      {loading ? (
        <>
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-pink-500" />
          <p className="text-sm text-gray-500">Đang xác thực JWT...</p>
        </>
      ) : errorMsg ? (
        <>
          <div className="max-w-md text-center">
            <p className="mb-2 text-lg font-semibold text-red-500">Không thể truy cập</p>
            <p className="text-sm leading-6 text-gray-500">{errorMsg}</p>
          </div>
          <a
            href="/"
            className="rounded-lg bg-pink-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-pink-600"
          >
            Về trang đăng nhập
          </a>
        </>
      ) : null}
    </div>
  );
}