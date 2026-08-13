// File: src/hooks/usePendingUsers.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
// 1. Nhúng Server Actions vào
import { approveUserAction, rejectUserAction } from "@/app/(admin)/actions/adminActions"; 

export function usePendingUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("id, username, display_name, avatar_url, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else setUsers(data || []);
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  // 2. Viết lại hàm duyệt bằng cách gọi Server Action
  const approveUser = async (userId: string) => {
    const isConfirm = window.confirm("Bạn có chắc muốn DUYỆT tài khoản này?");
    if (!isConfirm) return false;

    // Gọi lên Server để update (đi xuyên qua RLS)
    const response = await approveUserAction(userId);

    if (!response.success) {
      alert("Lỗi khi duyệt: " + response.message);
      return false;
    } else {
      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userId));
      alert("Đã duyệt thành công!");
      return true;
    }
  };

  // 3. Viết lại hàm từ chối bằng cách gọi Server Action
  const rejectUser = async (userId: string) => {
    const isConfirm = window.confirm("Bạn có chắc muốn TỪ CHỐI tài khoản này?");
    if (!isConfirm) return false;

    const response = await rejectUserAction(userId);

    if (!response.success) {
      alert("Lỗi khi từ chối: " + response.message);
      return false;
    } else {
      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userId));
      return true;
    }
  };

  return { users, loading, error, refreshUsers: fetchPendingUsers, approveUser, rejectUser };
}