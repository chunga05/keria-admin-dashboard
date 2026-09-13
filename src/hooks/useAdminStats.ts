// File: src/hooks/useAdminStats.ts
// ─── Tối ưu: 5 requests → 1 RPC call ─────────────────────────────────────────
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface AdminStats {
  approvedUsers: number;
  pendingUsers: number;
  totalPosts: number;
  totalWishes: number;
  hiddenWishes: number;
}

const DEFAULT_STATS: AdminStats = {
  approvedUsers: 0,
  pendingUsers: 0,
  totalPosts: 0,
  totalWishes: 0,
  hiddenWishes: 0,
};

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      // 1 RPC call thay cho 5 HTTP requests riêng biệt
      // Yêu cầu chạy SQL migration: supabase_migration.sql
      const { data, error } = await supabase.rpc("get_admin_stats");

      if (cancelled) return;

      if (error) {
        setError(error.message);
        setStats(DEFAULT_STATS);
      } else {
        setStats(data as AdminStats);
      }
      setLoading(false);
    };

    fetchStats();
    return () => { cancelled = true; };
  }, []);

  return { stats, loading, error };
}
