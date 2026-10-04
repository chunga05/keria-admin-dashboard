"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminStats } from "@/hooks/useAdminStats";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

// ─── Stats Card ───────────────────────────────────────────────────────────────
function StatsCard({
  title,
  value,
  loading,
  color,
  icon,
  href,
}: {
  title: string;
  value: number;
  loading: boolean;
  color: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href}>
      <div
        className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-md transition-shadow cursor-pointer`}
      >
        <div className="flex items-center justify-between mb-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}
          >
            {icon}
          </div>
          {loading ? (
            <div className="h-8 w-16 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          ) : (
            <span className="text-3xl font-black text-gray-800 dark:text-white">
              {value.toLocaleString()}
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      </div>
    </Link>
  );
}

// ─── Mini Table ───────────────────────────────────────────────────────────────
function SectionCard({
  title,
  viewAllHref,
  children,
}: {
  title: string;
  viewAllHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
        <h3 className="font-semibold text-gray-800 dark:text-white">{title}</h3>
        <Link
          href={viewAllHref}
          className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          Xem tất cả →
        </Link>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface PreviewUser {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}
interface PreviewWish {
  id: number;
  content: string;
  guest_name: string | null;
  user_id: string | null;
  is_hidden: boolean;
  react_heart: number;
}
interface PreviewPost {
  id: string;
  content: string;
  image_urls: string[] | null;
  likes_count: number;
  created_at: string;
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardClient() {
  const { stats, loading: statsLoading } = useAdminStats();

  const [pendingUsers, setPendingUsers] = useState<PreviewUser[]>([]);
  const [recentWishes, setRecentWishes] = useState<PreviewWish[]>([]);
  const [recentPosts, setRecentPosts] = useState<PreviewPost[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchPreviewData = async () => {
      try {
        const [usersRes, wishesRes, postsRes] = await Promise.all([
          supabase
            .from("users")
            .select("id, display_name, username, avatar_url, created_at")
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("fan_wishes")
            .select("id, content, guest_name, user_id, is_hidden, react_heart")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("posts")
            .select("id, content, image_urls, likes_count, created_at")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        if (cancelled) return;

        if (usersRes.error) console.error("Preview users:", usersRes.error.message);
        if (wishesRes.error) console.error("Preview wishes:", wishesRes.error.message);
        if (postsRes.error) console.error("Preview posts:", postsRes.error.message);

        setPendingUsers((usersRes.data as PreviewUser[]) || []);
        setRecentWishes((wishesRes.data as PreviewWish[]) || []);
        setRecentPosts((postsRes.data as PreviewPost[]) || []);
      } catch (err) {
        if (!cancelled) console.error("Dashboard fetch failed:", err);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    };

    fetchPreviewData();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-black text-gray-800 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Tổng quan hệ thống quản trị fanbase DKVN
        </p>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="Thành viên đã duyệt"
          value={stats.approvedUsers}
          loading={statsLoading}
          color="bg-green-100 dark:bg-green-900/30"
          href="/duyet-thanh-vien"
          icon={
            <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Chờ phê duyệt"
          value={stats.pendingUsers}
          loading={statsLoading}
          color="bg-yellow-100 dark:bg-yellow-900/30"
          href="/duyet-thanh-vien"
          icon={
            <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Tổng bài viết"
          value={stats.totalPosts}
          loading={statsLoading}
          color="bg-blue-100 dark:bg-blue-900/30"
          href="/post/create"
          icon={
            <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatsCard
          title="Tổng lời chúc"
          value={stats.totalWishes}
          loading={statsLoading}
          color="bg-pink-100 dark:bg-pink-900/30"
          href="/wishes"
          icon={
            <svg className="h-6 w-6 text-pink-600 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
        />
      </div>

      {/* ── Preview Tables ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Pending Users */}
        <SectionCard title="⏳ Thành viên chờ duyệt" viewAllHref="/duyet-thanh-vien">
          {dataLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-3 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : pendingUsers.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-4">
              🎉 Không có tài khoản nào đang chờ duyệt.
            </p>
          ) : (
            <ul className="space-y-3">
              {pendingUsers.map((user) => (
                <li key={user.id} className="flex items-center gap-3">
                  <img
                    src={user.avatar_url || "/images/user/user-01.png"}
                    alt={user.display_name}
                    referrerPolicy="no-referrer"
                    className="h-9 w-9 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-800 dark:text-white">
                      {user.display_name}
                    </p>
                    <p className="truncate text-xs text-gray-400 font-mono">@{user.username}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(user.created_at).toLocaleDateString("vi-VN")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Recent Wishes */}
        <SectionCard title="💌 Lời chúc mới nhất" viewAllHref="/wishes">
          {dataLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
              ))}
            </div>
          ) : recentWishes.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-4">Chưa có lời chúc nào.</p>
          ) : (
            <ul className="space-y-3">
              {recentWishes.map((w) => (
                <li key={w.id} className="rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-gray-800 p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {w.user_id
                        ? `Thành viên (${w.user_id.slice(0, 6)}...)`
                        : w.guest_name || "Ẩn danh"}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {w.is_hidden && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600">Đã ẩn</span>
                      )}
                      {w.react_heart > 0 && (
                        <span className="text-xs text-pink-500">❤️ {w.react_heart}</span>
                      )}
                    </div>
                  </div>
                  <p className="line-clamp-2 text-sm text-gray-700 dark:text-gray-300">{w.content}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Recent Posts */}
        <SectionCard title="📝 Bài viết gần đây" viewAllHref="/post/create">
          {dataLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
              ))}
            </div>
          ) : recentPosts.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-4">Chưa có bài viết nào.</p>
          ) : (
            <ul className="space-y-3">
              {recentPosts.map((p) => (
                <li
                  key={p.id}
                  className="flex items-start gap-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-gray-800 p-3"
                >
                  {p.image_urls && p.image_urls.length > 0 && (
                    <img
                      src={p.image_urls[0]}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-2 text-sm text-gray-700 dark:text-gray-300">
                      {p.content || "(Không có nội dung)"}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                      <span>❤️ {p.likes_count ?? 0}</span>
                      <span>{new Date(p.created_at).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Quick Links */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
            <h3 className="font-semibold text-gray-800 dark:text-white">🚀 Truy cập nhanh</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 p-6">
            {[
              { label: "Duyệt thành viên", href: "/duyet-thanh-vien", emoji: "👥", bg: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800" },
              { label: "Đăng bài viết", href: "/post/create", emoji: "✏️", bg: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
              { label: "Quản lý lời chúc", href: "/wishes", emoji: "💌", bg: "bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800" },
              { label: "Quản lý khung viền", href: "/frame", emoji: "🖼️", bg: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition-transform hover:-translate-y-0.5 hover:shadow-sm ${item.bg}`}
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-xs font-semibold">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
