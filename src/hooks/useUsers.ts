// File: src/hooks/useUsers.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useConfirm } from "@/context/ConfirmContext";
import {
  approveUserAction,
  rejectUserAction,
  banUserAction,
  reactivateUserAction,
} from "@/app/(admin)/actions/adminActions";

export type UserStatus = "pending" | "approved" | "rejected" | "banned";

export interface AdminUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  passport_code: string | null;
  status: UserStatus;
  role: string;
  address: string | null;
  last_wish_at: string | null;
  created_at: string;
}

export function useUsers(status: UserStatus, filters: { search?: string; startDate?: string; endDate?: string } = {}) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const confirm = useConfirm();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from("users")
      .select(
        "id, username, display_name, avatar_url, bio, passport_code, status, role, address, last_wish_at, created_at"
      )
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (filters.search?.trim()) {
      query = query.or(
        `username.ilike.%${filters.search.trim()}%,display_name.ilike.%${filters.search.trim()}%`
      );
    }
    
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate + 'T23:59:59');
    }

    const { data, error } = await query;
    if (error) setError(error.message);
    else setUsers((data as AdminUser[]) || []);
    setLoading(false);
  }, [status, filters.search, filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const approveUser = async (userId: string) => {
    const ok = await confirm({
      title: "Duyệt tài khoản?",
      message: "Thành viên sẽ được truy cập đầy đủ vào fanbase sau khi được duyệt.",
      confirmLabel: "Duyệt",
      variant: "primary",
    });
    if (!ok) return;
    const res = await approveUserAction(userId);
    if (!res.success) {
      await confirm({ title: "Lỗi", message: res.message, confirmLabel: "Đóng", cancelLabel: "", variant: "danger" });
    } else {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
  };

  const rejectUser = async (userId: string) => {
    const ok = await confirm({
      title: "Từ chối tài khoản?",
      message: "Thao tác này sẽ từ chối yêu cầu đăng ký của thành viên.",
      confirmLabel: "Từ chối",
      variant: "danger",
    });
    if (!ok) return;
    const res = await rejectUserAction(userId);
    if (!res.success) {
      await confirm({ title: "Lỗi", message: res.message, confirmLabel: "Đóng", cancelLabel: "", variant: "danger" });
    } else {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
  };

  const banUser = async (userId: string) => {
    const ok = await confirm({
      title: "Khoá tài khoản?",
      message: "Thành viên sẽ không thể đăng nhập cho đến khi được kích hoạt lại.",
      confirmLabel: "Khoá",
      variant: "warning",
    });
    if (!ok) return;
    const res = await banUserAction(userId);
    if (!res.success) {
      await confirm({ title: "Lỗi", message: res.message, confirmLabel: "Đóng", cancelLabel: "", variant: "danger" });
    } else {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
  };

  const reactivateUser = async (userId: string) => {
    const ok = await confirm({
      title: "Kích hoạt lại tài khoản?",
      message: "Thành viên sẽ có thể đăng nhập trở lại.",
      confirmLabel: "Kích hoạt",
      variant: "primary",
    });
    if (!ok) return;
    const res = await reactivateUserAction(userId);
    if (!res.success) {
      await confirm({ title: "Lỗi", message: res.message, confirmLabel: "Đóng", cancelLabel: "", variant: "danger" });
    } else {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
  };

  return {
    users,
    loading,
    error,
    refresh: fetchUsers,
    approveUser,
    rejectUser,
    banUser,
    reactivateUser,
  };
}
