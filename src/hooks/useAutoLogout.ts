'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { tokenStore } from '@/lib/tokenStore';

interface UseAutoLogoutOptions {
  timeoutInMinutes?: number;
  redirectPath?: string;
}

export function useAutoLogout({
  timeoutInMinutes = 15,
  redirectPath = '/',
}: UseAutoLogoutOptions = {}) {
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = useCallback(async () => {
    try {
      await tokenStore.logout(); // Revokes token family server-side
    } catch { /* best-effort */ }
    alert('Phiên làm việc đã kết thúc do bạn không hoạt động trong thời gian dài.');
    router.replace(redirectPath);
  }, [redirectPath, router]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(handleLogout, timeoutInMinutes * 60 * 1000);
  }, [handleLogout, timeoutInMinutes]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;
    const handler = () => resetTimer();
    resetTimer();
    events.forEach((e) => window.addEventListener(e, handler));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, handler));
    };
  }, [resetTimer]);
}