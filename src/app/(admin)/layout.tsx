"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import React, { useEffect, useState } from "react";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Tự động đăng xuất sau 15 phút không tương tác
  useAutoLogout({
    timeoutInMinutes: 15,
    redirectPath: "/",
  });

  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  useEffect(() => {
    const rawUserUrl = (process.env.NEXT_PUBLIC_USER_URL || "http://localhost:3000").trim().replace(/^(https?):+:?\/*/, '$1://');
    const userUrl = rawUserUrl.replace(/\/$/, "");
    const loginTarget = `${userUrl}/login?next=${encodeURIComponent(window.location.href)}`;

    const token = getCookie("dkvn_at") || getCookie("dkvn_admin_at");
    const refreshToken = getCookie("dkvn_rt") || getCookie("dkvn_admin_rt");

    // Nếu không có bất kỳ token nào trong cookie -> Đá về trang đăng nhập chung
    if (!token && !refreshToken) {
      window.location.href = loginTarget;
      return;
    }

    setIsAuthorized(true);
  }, []);

  // Đang kiểm tra xác thực ban đầu
  if (isAuthorized === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-pink-500" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Đang xác thực quyền Admin...
          </p>
        </div>
      </div>
    );
  }

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
      </div>
    </div>
  );
}
