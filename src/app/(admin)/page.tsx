import type { Metadata } from "next";
import React from "react";

// Bạn có thể đổi tên metadata cho đúng với dự án của mình
export const metadata: Metadata = {
  title: "Admin CMS | Quản lý Lời chúc",
  description: "Trang quản trị nội dung hệ thống",
};

export default function AdminDashboard() {
  return (
    <div className="p-4 md:p-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-4">
          Chào mừng đến với hệ thống Quản trị
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Khu vực này sẽ được dùng để hiển thị bảng danh sách lời chúc từ người dùng.
        </p>
        
        {/* Sắp tới chúng ta sẽ import Component Table (Bảng) vào vị trí này */}
        
      </div>
    </div>
  );
}