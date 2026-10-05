"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useUsers } from "@/hooks/useUsers";
import type { UserStatus } from "@/hooks/useUsers";
import { TableFilter } from "@/components/ui/table/TableFilter";

type Tab = { label: string; status: UserStatus; badge?: boolean };

const TABS: Tab[] = [
  { label: "⏳ Chờ duyệt", status: "pending", badge: true },
  { label: "✅ Đã duyệt", status: "approved" },
  { label: "❌ Từ chối", status: "rejected" },
  { label: "🔒 Bị khoá", status: "banned" },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    banned: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  };
  const label: Record<string, string> = {
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    banned: "Bị khoá",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${map[status] ?? ""}`}>
      {label[status] ?? status}
    </span>
  );
}

export default function PendingUsersPage() {
  const [activeTab, setActiveTab] = useState<UserStatus>("pending");
  const [filters, setFilters] = useState<{ search?: string; startDate?: string; endDate?: string }>({});

  const { users, loading, error, refresh, approveUser, rejectUser, banUser, reactivateUser } =
    useUsers(activeTab, filters);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-800 dark:text-white">Quản lý Tài khoản</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Duyệt, từ chối và quản lý thành viên fanbase
        </p>
      </div>

      <TableFilter onFilterChange={setFilters} placeholder="Tìm username, tên..." />

      {/* Tabs + Search */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          {/* Tabs */}
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
            {TABS.map((tab) => (
              <button
                key={tab.status}
                onClick={() => { setActiveTab(tab.status); }}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all sm:flex-none ${
                  activeTab === tab.status
                    ? "bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Làm mới
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            ⚠️ {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase text-gray-400 dark:border-gray-800">
                <th className="px-6 py-3 font-semibold">Thành viên</th>
                <th className="px-6 py-3 font-semibold hidden md:table-cell">Username</th>
                <th className="px-6 py-3 font-semibold hidden lg:table-cell">Passport</th>
                <th className="px-6 py-3 font-semibold hidden lg:table-cell">Role</th>
                <th className="px-6 py-3 font-semibold hidden sm:table-cell">Ngày đăng ký</th>
                <th className="px-6 py-3 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="space-y-2">
                          <div className="h-3.5 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                          <div className="h-3 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                    {activeTab === "pending"
                      ? "🎉 Không có tài khoản nào đang chờ duyệt!"
                      : "Không có dữ liệu."}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors">
                    {/* Avatar + Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar_url || "/images/user/user-01.png"}
                          referrerPolicy="no-referrer"
                          alt={user.display_name}
                          className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                        />
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">
                            {user.display_name}
                          </p>
                          <p className="text-xs text-gray-400 md:hidden font-mono">@{user.username}</p>
                        </div>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs font-mono text-gray-600 dark:text-gray-300">
                        @{user.username}
                      </span>
                    </td>

                    {/* Passport */}
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {user.passport_code ? (
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                          {user.passport_code}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}>
                        {user.role}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-xs text-gray-400 hidden sm:table-cell">
                      {new Date(user.created_at).toLocaleDateString("vi-VN", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {activeTab === "pending" && (
                          <>
                            <button
                              onClick={() => approveUser(user.id)}
                              className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-green-600 shadow-sm"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => rejectUser(user.id)}
                              className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-500 transition hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                            >
                              Từ chối
                            </button>
                          </>
                        )}
                        {activeTab === "approved" && (
                          <button
                            onClick={() => banUser(user.id)}
                            className="rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-600 transition hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400"
                          >
                            🔒 Khoá
                          </button>
                        )}
                        {activeTab === "rejected" && (
                          <button
                            onClick={() => approveUser(user.id)}
                            className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
                          >
                            Duyệt lại
                          </button>
                        )}
                        {activeTab === "banned" && (
                          <button
                            onClick={() => reactivateUser(user.id)}
                            className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-bold text-green-600 transition hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                          >
                            🔓 Mở khoá
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {!loading && users.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-3 dark:border-gray-800">
            <p className="text-xs text-gray-400">
              Hiển thị <strong className="text-gray-600 dark:text-gray-300">{users.length}</strong> tài khoản
            </p>
          </div>
        )}
      </div>
    </div>
  );
}