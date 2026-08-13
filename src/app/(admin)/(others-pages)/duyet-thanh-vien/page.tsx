// file: app/admin/duyet-thanh-vien/page.tsx
"use client";

import { usePendingUsers } from "@/hooks/usePendingUsers"; // Sửa lại đường dẫn import nếu cần

export default function PendingUsersPage() {
  // Bốc toàn bộ logic và data từ custom hook ra
  const { 
    users, 
    loading, 
    error, 
    refreshUsers, 
    approveUser, 
    rejectUser 
  } = usePendingUsers();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        
        {/* HEADER BẢNG */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Duyệt Thành Viên Mới</h1>
            <p className="text-sm text-gray-500 mt-1">
              Danh sách các tài khoản đăng nhập lần đầu đang chờ phê duyệt.
            </p>
          </div>
          <button 
            onClick={refreshUsers} // Gắn hàm làm mới vào đây
            className="rounded-md bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100 transition"
          >
            Làm mới danh sách
          </button>
        </div>

        {/* THÔNG BÁO LỖI NẾU CÓ */}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-red-600">
            Có lỗi xảy ra: {error}
          </div>
        )}

        {/* BẢNG HIỂN THỊ */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 uppercase text-gray-500 text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">Tài khoản</th>
                <th className="px-6 py-4 font-semibold">Username</th>
                <th className="px-6 py-4 font-semibold">Ngày đăng ký</th>
                <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              
              {/* TRẠNG THÁI 1: LOADING */}
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) 
              
              /* TRẠNG THÁI 2: TRỐNG */
              : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    Không có tài khoản nào đang chờ duyệt.
                  </td>
                </tr>
              ) 
              
              /* TRẠNG THÁI 3: CÓ DỮ LIỆU */
              : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    
                    {/* Thông tin User */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar_url || "/default-avatar.png"}
                          alt="avatar"
                          referrerPolicy="no-referrer"
                          className="h-10 w-10 rounded-full object-cover border border-gray-200"
                        />
                        <span className="font-bold text-gray-800">{user.display_name}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 font-mono">
                        {user.username}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {new Date(user.created_at).toLocaleDateString("vi-VN", {
                        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </td>

                    {/* Nút thao tác */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => approveUser(user.id)}
                          className="rounded-md bg-green-500 px-4 py-2 text-white font-bold hover:bg-green-600 transition shadow-sm"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => rejectUser(user.id)}
                          className="rounded-md bg-red-50 text-red-500 px-4 py-2 font-bold hover:bg-red-100 transition"
                        >
                          Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}