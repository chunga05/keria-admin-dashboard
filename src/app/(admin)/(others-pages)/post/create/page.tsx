"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { getPosts, uploadMediaFile, createPost, deletePost, Post } from "@/hooks/postService";

function ConfirmDeleteModal({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Xác nhận xoá</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Bạn có chắc muốn xoá bài viết này? Hành động này không thể hoàn tác.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 transition"
          >
            Xoá bài viết
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManagePostsPage() {
  const [content, setContent] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [posts, setPosts] = useState<Post[]>([]);
  const [fetching, setFetching] = useState(true);

  // Delete confirm modal
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setFetching(true);
    const { data } = await getPosts();
    if (data) setPosts(data);
    setFetching(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    const previewUrls = imageFiles.map((file) => URL.createObjectURL(file));
    setImagePreviewUrls(previewUrls);

    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageFiles]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files)
      setImageFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setVideoFile(e.target.files[0]);
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      let imageUrls: string[] = [];
      for (const file of imageFiles) {
        const url = await uploadMediaFile(file, "images");
        imageUrls.push(url);
      }
      let videoUrl: string | null = null;
      if (videoFile) videoUrl = await uploadMediaFile(videoFile, "videos");

      await createPost({ content, image_urls: imageUrls, video_url: videoUrl });

      setSuccessMessage("✅ Đăng bài viết thành công!");
      setContent("");
      setImageFiles([]);
      setVideoFile(null);
      fetchPosts();
    } catch (err: any) {
      setErrorMessage(err.message || "Có lỗi xảy ra khi đăng bài.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTargetId) return;
    const res = await deletePost(deleteTargetId);
    setDeleteTargetId(null);
    if (res.success) {
      setPosts((prev) => prev.filter((p) => p.id !== deleteTargetId));
    } else {
      alert("Lỗi khi xoá: " + res.message);
    }
  };

  return (
    <>
      <ConfirmDeleteModal
        open={!!deleteTargetId}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteTargetId(null)}
      />

      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-gray-800 dark:text-white">Quản lý Bài viết</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Đăng bài và quản lý nội dung trên trang fanbase
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

          {/* ─── COL LEFT: Danh sách bài viết ─── */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
                Bài đã đăng ({posts.length})
              </h2>
              <button
                onClick={fetchPosts}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Làm mới
              </button>
            </div>

            {fetching ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700 mb-3" />
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded bg-gray-100 dark:bg-gray-800" />
                      <div className="h-3 w-3/4 rounded bg-gray-100 dark:bg-gray-800" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center dark:border-gray-700">
                <p className="text-sm text-gray-400">Chưa có bài viết nào. Hãy đăng bài đầu tiên!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03]"
                  >
                    {/* Meta */}
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {new Date(post.created_at).toLocaleString("vi-VN")}
                      </span>
                      <button
                        onClick={() => setDeleteTargetId(post.id)}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-900/20"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Xoá
                      </button>
                    </div>

                    {/* Content */}
                    {post.content && (
                      <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line mb-3">
                        {post.content}
                      </p>
                    )}

                    {/* Images */}
                    {post.image_urls?.length > 0 && (
                      <div className={`grid gap-2 ${post.image_urls.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                        {post.image_urls.map((url, i) => (
                          <div key={i} className="relative h-40 w-full overflow-hidden rounded-xl bg-gray-100 border border-gray-100 dark:border-gray-800">
                            <Image src={url} alt="Post image" fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Video */}
                    {post.video_url && (
                      <div className="mt-2">
                        <video controls className="w-full rounded-xl max-h-48 bg-black">
                          <source src={post.video_url} type="video/mp4" />
                        </video>
                      </div>
                    )}

                    {/* Likes */}
                    <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                      <svg className="h-3.5 w-3.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      {post.likes_count ?? 0} lượt thích
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── COL RIGHT: Form đăng bài ─── */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="text-base font-bold text-gray-800 dark:text-white mb-5 border-b border-gray-100 dark:border-gray-800 pb-4">
                ✏️ Tạo Bài Viết Mới
              </h2>

              {errorMessage && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Content */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Nội dung
                  </label>
                  <textarea
                    rows={5}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Nhập nội dung bài viết..."
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                  />
                </div>

                {/* Images */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Hình ảnh
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="block w-full text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300"
                  />
                  {imageFiles.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {imageFiles.map((file, index) => (
                        <div key={index} className="relative group h-20 overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                          <img src={imagePreviewUrls[index]} alt="preview" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] opacity-0 transition group-hover:opacity-100"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Video */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Video (tuỳ chọn)
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="block w-full text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-purple-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-900/30 dark:file:text-purple-300"
                  />
                  {videoFile && (
                    <p className="mt-1 text-xs text-gray-500">
                      📎 {videoFile.name}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full rounded-xl py-3 text-sm font-bold text-white transition-all ${
                    loading
                      ? "bg-blue-300 cursor-not-allowed dark:bg-blue-900"
                      : "bg-blue-600 hover:bg-blue-700 shadow-sm"
                  }`}
                >
                  {loading ? "Đang đăng bài..." : "🚀 Đăng Bài Viết"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}