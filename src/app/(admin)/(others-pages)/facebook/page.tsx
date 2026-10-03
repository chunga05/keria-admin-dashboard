"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

type FacebookLink = {
  id: string;
  title: string | null;
  url: string;
  thumbnail_url: string | null;
  created_at: string;
};

// ── Component card từng link ──────────────────────────────────
function FacebookLinkCard({
  link,
  onDelete,
  onThumbnailSaved,
}: {
  link: FacebookLink;
  onDelete: (id: string) => void;
  onThumbnailSaved: (id: string, url: string) => void;
}) {
  const [editingThumb, setEditingThumb] = useState(false);
  const [thumbInput, setThumbInput] = useState(link.thumbnail_url || "");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleSaveThumb = async () => {
    setSaving(true);
    setSaveMsg(null);
    const { error } = await supabase
      .from("facebook_links")
      .update({ thumbnail_url: thumbInput.trim() || null })
      .eq("id", link.id)
      .select();

    setSaving(false);

    if (error) {
      setSaveMsg({ type: "error", text: `Lỗi: ${error.message}` });
      return;
    }

    onThumbnailSaved(link.id, thumbInput.trim());
    setSaveMsg({ type: "success", text: "✅ Đã lưu thumbnail!" });
    setTimeout(() => {
      setEditingThumb(false);
      setSaveMsg(null);
    }, 1200);
  };

  const currentThumb = editingThumb ? thumbInput : (link.thumbnail_url || "");

  return (
    <div className="group rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Row chính */}
      <div className="flex gap-4 p-4">
        {/* Thumbnail — click để edit */}
        <button
          type="button"
          onClick={() => { setEditingThumb(true); setThumbInput(link.thumbnail_url || ""); }}
          title="Chỉnh sửa thumbnail"
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 ring-offset-2 transition hover:ring-2 hover:ring-[#1877F2] focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
        >
          {link.thumbnail_url ? (
            <Image
              src={link.thumbnail_url}
              alt={link.title || "Facebook"}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#D1D5DB">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>
          )}
          {/* Overlay bút chì khi hover */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </div>
          {/* Badge thiếu ảnh */}
          {!link.thumbnail_url && (
            <span className="absolute bottom-0 left-0 right-0 bg-amber-400/90 py-0.5 text-center text-[9px] font-bold text-white">
              Thiếu ảnh
            </span>
          )}
        </button>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-200">
              {link.title || <span className="italic text-gray-400">Chưa đặt tiêu đề</span>}
            </p>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 block truncate text-xs text-[#1877F2] hover:underline"
            >
              {link.url}
            </a>
          </div>
          <p className="text-xs text-gray-400">
            {new Date(link.created_at).toLocaleString("vi-VN")}
          </p>
        </div>

        {/* Nút xoá */}
        <div className="flex shrink-0 items-start">
          {deleteConfirm ? (
            <div className="flex gap-2">
              <button
                onClick={() => onDelete(link.id)}
                className="rounded-lg bg-red-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-600"
              >
                Xác nhận
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="rounded-lg border px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-50 dark:border-gray-700"
              >
                Huỷ
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-900/20"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Xoá
            </button>
          )}
        </div>
      </div>

      {/* Panel edit thumbnail — mở khi click ảnh */}
      {editingThumb && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 dark:border-gray-800">
          <p className="mb-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
            ✏️ Cập nhật URL Thumbnail
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              autoFocus
              value={thumbInput}
              onChange={(e) => setThumbInput(e.target.value)}
              placeholder="https://... (link ảnh trực tiếp)"
              className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1877F2] focus:outline-none focus:ring-2 focus:ring-[#1877F2]/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <button
              onClick={handleSaveThumb}
              disabled={saving}
              className="rounded-xl bg-[#1877F2] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1464d8] disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
            <button
              onClick={() => { setEditingThumb(false); setSaveMsg(null); }}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Huỷ
            </button>
          </div>

          {/* Feedback sau khi lưu */}
          {saveMsg && (
            <div className={`mt-2 rounded-lg px-3 py-2 text-sm font-medium ${
              saveMsg.type === "success"
                ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
            }`}>
              {saveMsg.text}
            </div>
          )}

          {/* Preview ảnh nhập vào */}
          {thumbInput && (
            <div className="relative mt-3 h-32 w-full overflow-hidden rounded-xl border border-gray-100 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
              <Image
                src={thumbInput}
                alt="Preview"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <p className="mt-2 text-xs text-gray-400">
            💡 Click chuột phải ảnh trên FB → &quot;Sao chép địa chỉ ảnh&quot; rồi dán vào đây
          </p>
        </div>
      )}
    </div>
  );
}

// ── Component chính ───────────────────────────────────────────
export default function AdminFacebookPage() {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [links, setLinks] = useState<FacebookLink[]>([]);
  const [fetching, setFetching] = useState(true);

  const fetchLinks = useCallback(async () => {
    setFetching(true);
    const { data } = await supabase
      .from("facebook_links")
      .select("id, title, url, thumbnail_url, created_at")
      .order("created_at", { ascending: false });
    setLinks(data || []);
    setFetching(false);
  }, []);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (!url.includes("facebook.com")) {
      setFormMsg({ type: "error", text: "Vui lòng nhập đúng đường dẫn Facebook!" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("facebook_links").insert([
      {
        title: title.trim() || null,
        url: url.trim(),
        thumbnail_url: thumbnailUrl.trim() || null,
      },
    ]);

    if (error) {
      setFormMsg({ type: "error", text: `Lỗi: ${error.message}` });
    } else {
      setFormMsg({ type: "success", text: "✅ Thêm link Facebook thành công!" });
      setTitle("");
      setUrl("");
      setThumbnailUrl("");
      fetchLinks();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("facebook_links").delete().eq("id", id);
    if (!error) setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const handleThumbnailSaved = (id: string, newUrl: string) => {
    setLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, thumbnail_url: newUrl || null } : l))
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-800 dark:text-white">
          Quản lý Facebook Feed
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Thêm/xoá bài viết Facebook hiển thị trên trang chủ.{" "}
          <span className="font-semibold text-amber-500">Click vào ảnh</span> để cập nhật thumbnail bất kỳ lúc nào.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

        {/* ── COL LEFT: Danh sách ── */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
              Bài đã thêm ({links.length})
            </h2>
            <button
              onClick={fetchLinks}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Làm mới
            </button>
          </div>

          {fetching ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                  <div className="flex gap-4">
                    <div className="h-20 w-20 shrink-0 rounded-xl bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                      <div className="h-3 w-full rounded bg-gray-100 dark:bg-gray-800" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : links.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center dark:border-gray-700">
              <p className="text-sm text-gray-400">Chưa có link nào. Hãy thêm bài đầu tiên!</p>
            </div>
          ) : (
            <div className="max-h-[75vh] space-y-3 overflow-y-auto pr-1">
              {links.map((link) => (
                <FacebookLinkCard
                  key={link.id}
                  link={link}
                  onDelete={handleDelete}
                  onThumbnailSaved={handleThumbnailSaved}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── COL RIGHT: Form thêm ── */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="mb-5 border-b border-gray-100 pb-4 text-base font-bold text-gray-800 dark:border-gray-800 dark:text-white">
              ➕ Thêm Link Facebook
            </h2>

            {formMsg && (
              <div className={`mb-4 rounded-lg p-3 text-sm ${
                formMsg.type === "error"
                  ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  : "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
              }`}>
                {formMsg.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tiêu đề */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Tiêu đề bài viết
                  <span className="ml-1 font-normal text-gray-400">(tuỳ chọn)</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Kêu gọi donation sinh nhật Keria"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                />
              </div>

              {/* URL Facebook */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Đường dẫn Facebook
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.facebook.com/..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                />
              </div>

              {/* Thumbnail URL */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  URL Ảnh thumbnail
                  <span className="ml-1 font-normal text-gray-400">(có thể bổ sung sau)</span>
                </label>
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://... (link ảnh trực tiếp)"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                />
                {thumbnailUrl && (
                  <div className="relative mt-2 h-28 w-full overflow-hidden rounded-xl border border-gray-100 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
                    <Image
                      src={thumbnailUrl}
                      alt="Thumbnail preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <p className="mt-1.5 text-xs text-gray-400">
                  💡 Để trống được — click vào ảnh trong danh sách bên trái để bổ sung sau
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full rounded-xl py-3 text-sm font-bold text-white transition-all ${
                  submitting
                    ? "cursor-not-allowed bg-blue-300 dark:bg-blue-900"
                    : "bg-[#1877F2] shadow-sm hover:bg-[#1464d8]"
                }`}
              >
                {submitting ? "Đang lưu..." : "💾 Lưu Link Facebook"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}