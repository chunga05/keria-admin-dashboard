'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface UseAutoLogoutOptions {
  timeoutInMinutes?: number; // Thời gian không thao tác (mặc định 15 phút)
  redirectPath?: string;      // Đường dẫn sau khi đăng xuất
}

export function useAutoLogout({
  timeoutInMinutes = 15,
  redirectPath = '/',
}: UseAutoLogoutOptions = {}) {
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      alert('Phiên làm việc đã kết thúc do bạn không hoạt động trong thời gian dài.');
      router.replace(redirectPath);
    } catch (error) {
      console.error('Lỗi khi tự động đăng xuất:', error);
      router.replace(redirectPath);
    }
  }, [redirectPath, router]);

  const resetTimer = useCallback(() => {
    // Xóa bộ đếm cũ nếu có thao tác mới
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Thiết lập đếm ngược mới
    timerRef.current = setTimeout(() => {
      handleLogout();
    }, timeoutInMinutes * 60 * 1000);
  }, [handleLogout, timeoutInMinutes]);

  useEffect(() => {
    // Danh sách các sự kiện tương tác của người dùng
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    const handleUserActivity = () => {
      resetTimer();
    };

    // Bắt đầu đếm ngay khi component mount
    resetTimer();

    // Gắn listener theo dõi
    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity);
    });

    return () => {
      // Dọn dẹp listener và timer khi unmount
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [resetTimer]);
}