"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAdminFrames } from "@/hooks/useAdminFrames";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { deleteFrameAction } from "@/app/(admin)/actions/adminActions";
import { TableFilter } from "@/components/ui/table/TableFilter";

export default function AdminFramesPage() {
  const { addFrame, isUploading } = useAdminFrames();

  const [frameId, setFrameId] = useState("");
  const [frameName, setFrameName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [frames, setFrames] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ search?: string; startDate?: string; endDate?: string }>({});

  const fetchFrames = async () => {
    setIsLoading(true);
    let query = supabase
      .from("avatar_frames")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters.search?.trim()) {
      query = query.ilike('name', `%${filters.search.trim()}%`);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate + 'T23:59:59');
    }

    const { data } = await query;
    setFrames(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchFrames(); }, [filters]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addFrame(frameId, frameName, selectedFile);
    setFrameId("");
    setFrameName("");
    setSelectedFile(null);
    const fileInput = document.getElementById("file-upload") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
    fetchFrames();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Xoá khung viền "${name}"? Hành động này không thể hoàn tác.`)) return;
    setDeletingId(id);
    const res = await deleteFrameAction(id);
    if (!res.success) alert("Lỗi: " + res.message);
    else setFrames((prev) => prev.filter((f) => f.id !== id));
    setDeletingId(null);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-800 dark:text-white">Quản lý Khung viền</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Thêm và quản lý avatar frame cho thành viên
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">

        {/* ─── CỘT TRÁI: Form thêm mới ─── */}
        <div className="col-span-1 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="mb-6 text-base font-bold text-gray-800 dark:text-white">
            ➕ Thêm Khung Mới
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Mã ID (viết liền, không dấu)
              </label>
              <input
                type="text"
                required
                placeholder="VD: wisteria_birds"
                value={frameId}
                onChange={(e) => setFrameId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Tên hiển thị
              </label>
              <input
                type="text"
                required
                placeholder="VD: Hoa Tử Đằng"
                value={frameName}
                onChange={(e) => setFrameName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                File ảnh (PNG/GIF/WebP, nền trong suốt)
              </label>
              <input
                type="file"
                id="file-upload"
                accept="image/png, image/gif, image/webp"
                required
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-pink-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-pink-700 hover:file:bg-pink-100 dark:file:bg-pink-900/30 dark:file:text-pink-300"
              />
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className={`w-full rounded-xl py-3 text-sm font-bold text-white transition-all ${
                isUploading
                  ? "bg-gray-300 cursor-not-allowed dark:bg-gray-700"
                  : "bg-pink-500 hover:bg-pink-600 shadow-sm"
              }`}
            >
              {isUploading ? "Đang tải lên..." : "🖼️ Tạo Khung Viền"}
            </button>
          </form>
        </div>

        {/* ─── CỘT PHẢI: Danh sách khung ─── */}
        <div className="col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-800 dark:text-white">
              Danh Sách Khung ({frames.length})
            </h2>
            <button
              onClick={fetchFrames}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Làm mới
            </button>
          </div>

          <TableFilter onFilterChange={setFilters} placeholder="Tìm tên khung..." />

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
                  <div className="mx-auto mb-3 h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="mx-auto h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              ))}
            </div>
          ) : frames.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <span className="text-4xl mb-2">🖼️</span>
              <p className="text-sm">Chưa có khung viền nào.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {frames.map((frame) => (
                <div
                  key={frame.id}
                  className="group relative flex flex-col items-center rounded-xl border border-gray-100 bg-gray-50 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-white/[0.02]"
                >
                  {/* Preview */}
                  <div className="relative mb-3 flex h-24 w-24 items-center justify-center">
                    <div className="h-16 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <img
                        src="https://i.pravatar.cc/150?img=3"
                        alt="demo-avatar"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {typeof frame.image_url === "string" && frame.image_url.trim().length > 0 && (
                      <div className="absolute -inset-2 z-10 pointer-events-none">
                        <Image
                          src={frame.image_url}
                          alt={frame.name || "Khung viền"}
                          fill
                          sizes="100px"
                          className="object-contain"
                        />
                      </div>
                    )}
                  </div>

                  <span className="text-center text-sm font-bold text-gray-800 dark:text-white">
                    {frame.name}
                  </span>
                  <span className="mt-0.5 text-xs text-gray-400 font-mono">#{frame.id}</span>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(frame.id, frame.name)}
                    disabled={deletingId === frame.id}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-400 opacity-0 transition-opacity hover:bg-red-100 hover:text-red-600 group-hover:opacity-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 disabled:opacity-50"
                    title="Xoá khung"
                  >
                    {deletingId === frame.id ? (
                      <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}