"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import dynamic from "next/dynamic";

// Dynamic import để tránh SSR error với Tiptap (ProseMirror dùng DOM APIs)
const RichTextEditor = dynamic(
  () => import("@/components/editor/RichTextEditor"),
  { ssr: false, loading: () => <div className="min-h-[300px] rounded-lg border border-gray-200 bg-gray-50 animate-pulse" /> }
);
import Image from "next/image";
import {
  Edit,
  Trash2,
  Plus,
  X,
  Image as ImageIcon,
  Video,
  Loader2,
  Eye,
  Upload,
  RefreshCw,
} from "lucide-react";

import {
  getAdminContents,
  ContentRecord,
} from "@/hooks/contentServices";
import {
  createContentAction,
  updateContentAction,
  deleteContentAction,
  ContentInput,
} from "@/app/(admin)/actions/adminActions";
import { uploadFileToR2 } from "@/lib/uploadR2Client";

const CATEGORIES = [
  { value: "led", label: "LED" },
  { value: "charity", label: "Thiện Nguyện" },
  { value: "giveaway", label: "Give Away" },
  { value: "offline", label: "Offline Event" },
];

// ==========================================================
// AUTO SLUG
// ==========================================================
function createSlug(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function AdminContentPage() {
  const [contents, setContents] = useState<ContentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modal thêm/sửa
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal xem bài viết
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingContent, setViewingContent] = useState<ContentRecord | null>(null);

  // ID đang sửa
  const [editingId, setEditingId] = useState<string | null>(null);

  // Quản lý Slug thủ công
  const [isCustomSlug, setIsCustomSlug] = useState(false);

  // Quản lý Upload File (Không giới hạn dung lượng)
  const [mediaSource, setMediaSource] = useState<"url" | "file">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<ContentInput>({
    title: "",
    slug: "",
    category: "led",
    media_url: "",
    is_video: false,
    content: "",
  });

  // ==========================================================
  // LẤY DỮ LIỆU
  // ==========================================================
  const fetchContents = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminContents();
      setContents(data);
    } catch (error) {
      console.error(error);
      alert("Không thể tải danh sách dữ liệu!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, []);

  // ==========================================================
  // UPLOAD TỆP LÊN CLOUDFLARE R2 (qua API Route server-side)
  // ==========================================================
  const uploadMediaFile = async (file: File): Promise<string> => {
    // folder "content-media" trên R2 bucket
    return uploadFileToR2(file, "content-media");
  };

  // ==========================================================
  // MỞ FORM THÊM / SỬA
  // ==========================================================
  const handleOpenModal = (content?: ContentRecord) => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (content) {
      setEditingId(content.id);
      setIsCustomSlug(true);
      setMediaSource("url");
      setPreviewUrl(content.media_url || "");
      setFormData({
        title: content.title || "",
        slug: content.slug || createSlug(content.title),
        category: content.category || "led",
        media_url: content.media_url || "",
        is_video: content.is_video || false,
        content: content.content || "",
      });
    } else {
      setEditingId(null);
      setIsCustomSlug(false);
      setMediaSource("file");
      setPreviewUrl("");
      setFormData({
        title: "",
        slug: "",
        category: "led",
        media_url: "",
        is_video: false,
        content: "",
      });
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setSelectedFile(null);
    setPreviewUrl("");
  };

  // ==========================================================
  // MỞ POPUP BÀI VIẾT
  // ==========================================================
  const handleViewContent = (content: ContentRecord) => {
    setViewingContent(content);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setViewingContent(null);
    setIsViewModalOpen(false);
  };

  // ==========================================================
  // THAY ĐỔI TIÊU ĐỀ & SLUG
  // ==========================================================
  const handleTitleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      title: value,
      slug: isCustomSlug ? prev.slug : createSlug(value),
    }));
  };

  const handleSlugChange = (value: string) => {
    setIsCustomSlug(true);
    setFormData((prev) => ({
      ...prev,
      slug: createSlug(value),
    }));
  };

  const handleResetSlug = () => {
    setIsCustomSlug(false);
    setFormData((prev) => ({
      ...prev,
      slug: createSlug(prev.title),
    }));
  };

  // ==========================================================
  // CHỌN TỆP TỪ MÁY (ĐÃ BỎ HOÀN TOÀN GIỚI HẠN SIZE)
  // ==========================================================
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Không còn kiểm tra file.size nữa - chấp nhận mọi dung lượng
    const isVideo = file.type.startsWith("video/");
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));

    setFormData((prev) => ({
      ...prev,
      is_video: isVideo,
    }));
  };

  // ==========================================================
  // SAVE
  // ==========================================================
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("Vui lòng nhập tiêu đề!");
      return;
    }

    if (!formData.slug.trim()) {
      alert("Vui lòng nhập slug cho bài viết!");
      return;
    }

    // Tiptap trả về HTML, strip tags để kiểm tra nội dung thực sự có hay không
    const contentText = formData.content.replace(/<[^>]*>/g, "").trim();
    if (!contentText) {
      alert("Vui lòng nhập nội dung bài viết!");
      return;
    }

    if (mediaSource === "url" && !formData.media_url.trim()) {
      alert("Vui lòng nhập URL của hình ảnh hoặc video!");
      return;
    }

    if (mediaSource === "file" && !selectedFile && !formData.media_url) {
      alert("Vui lòng chọn một file hình ảnh hoặc video từ máy!");
      return;
    }

    setIsSaving(true);

    try {
      let finalMediaUrl = formData.media_url;

      // Nếu có chọn file mới từ máy -> upload lên Storage
      if (mediaSource === "file" && selectedFile) {
        setIsUploadingMedia(true);
        finalMediaUrl = await uploadMediaFile(selectedFile);
        setIsUploadingMedia(false);
      }

      const finalData: ContentInput = {
        ...formData,
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        media_url: finalMediaUrl,
        content: formData.content.trim(),
      };

      if (editingId) {
        const res = await updateContentAction(editingId, finalData);
        if (!res.success) {
          const isSlugDup = res.message?.includes("duplicate") || res.message?.includes("unique");
          alert(isSlugDup
            ? "Slug này đã tồn tại. Hãy đổi slug hoặc tiêu đề khác!"
            : "Có lỗi xảy ra khi lưu dữ liệu: " + res.message);
          return;
        }
      } else {
        const res = await createContentAction(finalData);
        if (!res.success) {
          const isSlugDup = res.message?.includes("duplicate") || res.message?.includes("unique");
          alert(isSlugDup
            ? "Slug này đã tồn tại. Hãy đổi slug hoặc tiêu đề khác!"
            : "Có lỗi xảy ra khi lưu dữ liệu: " + res.message);
          return;
        }
      }

      await fetchContents();
      closeModal();
    } catch (error: any) {
      console.error(error);
      alert("Có lỗi xảy ra: " + (error.message || ""));
    } finally {
      setIsSaving(false);
      setIsUploadingMedia(false);
    }
  };

  // ==========================================================
  // DELETE
  // ==========================================================
  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa content này?")) {
      return;
    }

    try {
      const res = await deleteContentAction(id);
      if (!res.success) {
        alert("Có lỗi xảy ra khi xóa dữ liệu: " + res.message);
        return;
      }

      // Xóa file trên Cloudflare R2 nếu là file đã upload (không xóa nếu là URL ngoài)
      if (res.mediaUrl) {
        const r2Domain = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
        if (r2Domain && res.mediaUrl.startsWith(r2Domain)) {
          // Gọi API xóa file R2 ở background (không block UI)
          fetch("/api/upload/delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: res.mediaUrl }),
          }).catch(console.warn);
        }
      }

      setContents((prev) => prev.filter((content) => content.id !== id));
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra khi xóa dữ liệu!");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 p-[clamp(16px,2.78vw,40px)]">
      <div className="mx-auto w-full max-w-[1200px] rounded-xl bg-white p-[clamp(20px,2.78vw,40px)] shadow-sm">
        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Quản Lý Project</h1>
            <p className="mt-1 text-sm text-gray-500">Quản lý sự kiện và bài viết</p>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 rounded-md bg-[#FF76C3] px-4 py-2 font-bold text-white transition-colors hover:bg-[#FF4D91]"
          >
            <Plus size={18} />
            Thêm Mới
          </button>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Hình/Video</th>
                <th className="px-4 py-3 font-semibold">Tiêu đề</th>
                <th className="px-4 py-3 font-semibold">Slug</th>
                <th className="px-4 py-3 font-semibold">Danh mục</th>
                <th className="px-4 py-3 font-semibold">Loại</th>
                <th className="px-4 py-3 text-center font-semibold">Hành động</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-gray-400" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : contents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    Chưa có bài viết nào. Hãy thêm mới!
                  </td>
                </tr>
              ) : (
                contents.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleViewContent(item)}
                    className="cursor-pointer transition-colors hover:bg-pink-50"
                  >
                    <td className="px-4 py-3">
                      <div className="relative h-16 w-24 overflow-hidden rounded-md bg-gray-200">
                        {item.is_video ? (
                          <video
                            src={item.media_url}
                            className="h-full w-full object-cover"
                            muted
                          />
                        ) : (
                          <Image
                            src={item.media_url || "/images/placeholder-banner.jpg"}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                    </td>

                    <td className="max-w-[220px] px-4 py-3">
                      <div className="font-semibold text-gray-800">{item.title}</div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-pink-500">
                        <Eye size={13} />
                        Xem bài viết
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                        {item.slug}
                      </code>
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase text-blue-700">
                        {item.category}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {item.is_video ? (
                        <span className="flex items-center gap-1 text-purple-600">
                          <Video size={16} />
                          Video
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <ImageIcon size={16} />
                          Hình ảnh
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewContent(item);
                          }}
                          className="text-pink-500 transition-colors hover:text-pink-700"
                          title="Xem bài viết"
                        >
                          <Eye size={20} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(item);
                          }}
                          className="text-blue-500 transition-colors hover:text-blue-700"
                          title="Sửa"
                        >
                          <Edit size={20} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                          className="text-red-500 transition-colors hover:text-red-700"
                          title="Xóa"
                        >
                          <Trash2 size={20} />
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

      {/* ======================================================= */}
      {/* MODAL THÊM / SỬA */}
      {/* ======================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <h2 className="text-xl font-bold text-gray-800">
                {editingId ? "Sửa bài viết" : "Thêm bài viết mới"}
              </h2>

              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              {/* TIÊU ĐỀ & SLUG */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Tiêu đề *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#FF76C3] focus:ring-1 focus:ring-[#FF76C3]"
                    placeholder="VD: KERIA tham gia..."
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700">Slug *</label>
                    <button
                      type="button"
                      onClick={handleResetSlug}
                      className="flex items-center gap-1 text-[11px] text-pink-500 hover:text-pink-600"
                      title="Đặt lại slug theo tiêu đề"
                    >
                      <RefreshCw size={11} /> Tự động
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono text-gray-700 outline-none focus:border-[#FF76C3] focus:ring-1 focus:ring-[#FF76C3]"
                    placeholder="slug-tu-dong-hoac-tu-nhap"
                  />
                </div>
              </div>

              {/* CATEGORY */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Danh mục
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#FF76C3] focus:ring-1 focus:ring-[#FF76C3]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* MEDIA (FILE HOẶC URL) */}
              <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3.5">
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
                  <span className="text-sm font-semibold text-gray-700">Tệp đa phương tiện</span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMediaSource("file")}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                        mediaSource === "file"
                          ? "bg-[#FF76C3] text-white"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      Chọn file từ máy
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaSource("url")}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                        mediaSource === "url"
                          ? "bg-[#FF76C3] text-white"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      Dán link URL
                    </button>
                  </div>
                </div>

                {mediaSource === "file" ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-4 transition hover:border-[#FF76C3]"
                    >
                      <Upload className="mb-1.5 h-7 w-7 text-gray-400" />
                      <p className="text-xs font-medium text-gray-600">
                        {selectedFile ? selectedFile.name : "Nhấp để chọn file ảnh hoặc video"}
                      </p>
                      <p className="mt-0.5 text-[10px] text-gray-400">
                        Hỗ trợ mọi định dạng ảnh và video (Không giới hạn dung lượng)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs text-gray-500">Đường dẫn tệp (URL)</label>
                      <div className="flex gap-3 text-xs">
                        <label className="flex cursor-pointer items-center gap-1">
                          <input
                            type="radio"
                            name="is_video"
                            checked={!formData.is_video}
                            onChange={() => setFormData({ ...formData, is_video: false })}
                          />
                          Ảnh
                        </label>
                        <label className="flex cursor-pointer items-center gap-1">
                          <input
                            type="radio"
                            name="is_video"
                            checked={formData.is_video}
                            onChange={() => setFormData({ ...formData, is_video: true })}
                          />
                          Video
                        </label>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={formData.media_url}
                      onChange={(e) => {
                        setFormData({ ...formData, media_url: e.target.value });
                        setPreviewUrl(e.target.value);
                      }}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#FF76C3]"
                      placeholder="https://..."
                    />
                  </div>
                )}

                {/* KHUNG XEM TRƯỚC (PREVIEW) */}
                {previewUrl && (
                  <div className="mt-3 overflow-hidden rounded-md border bg-black/5">
                    {formData.is_video ? (
                      <video
                        src={previewUrl}
                        controls
                        className="max-h-[180px] w-full object-contain"
                      />
                    ) : (
                      <div className="relative h-[160px] w-full">
                        <Image
                          src={previewUrl}
                          alt="Preview"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* NỘI DUNG BÀI VIẾT - RICH TEXT EDITOR */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Nội dung bài viết *
                </label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(html) =>
                    setFormData((prev) => ({ ...prev, content: html }))
                  }
                  placeholder="Bắt đầu soạn nội dung bài viết... Dùng toolbar để định dạng văn bản và chèn ảnh."
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="mt-1 flex justify-end gap-3 border-t pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploadingMedia}
                  className="flex min-w-[110px] items-center justify-center gap-1 rounded-md bg-[#FF76C3] px-4 py-2 text-sm font-bold text-white hover:bg-[#FF4D91] disabled:opacity-70"
                >
                  {isSaving || isUploadingMedia ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>{isUploadingMedia ? "Đang tải tệp..." : "Đang lưu..."}</span>
                    </>
                  ) : (
                    "Lưu lại"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* POPUP XEM BÀI VIẾT */}
      {/* ======================================================= */}
      {isViewModalOpen && viewingContent && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          onClick={closeViewModal}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeViewModal}
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
            >
              <X size={22} />
            </button>

            <div className="max-h-[90vh] overflow-y-auto">
              <div className="relative w-full bg-black">
                {viewingContent.is_video ? (
                  <video
                    src={viewingContent.media_url}
                    controls
                    className="max-h-[450px] w-full object-contain"
                  />
                ) : (
                  <div className="relative h-[350px] w-full">
                    <Image
                      src={viewingContent.media_url || "/images/placeholder-banner.jpg"}
                      alt={viewingContent.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              <article className="p-6 md:p-8">
                <span className="inline-block rounded-full bg-pink-100 px-3 py-1 text-xs font-bold uppercase text-pink-600">
                  {CATEGORIES.find((cat) => cat.value === viewingContent.category)?.label ||
                    viewingContent.category}
                </span>

                <h2 className="mt-3 text-2xl font-bold leading-tight text-gray-900 md:text-3xl">
                  {viewingContent.title}
                </h2>

                <p className="mt-2 text-xs text-gray-400">/{viewingContent.slug}</p>

                <div
                  className="mt-6 prose prose-sm max-w-none leading-7 text-gray-700 [&_img]:rounded-lg [&_a]:text-[#FF76C3] [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold clear-both"
                  dangerouslySetInnerHTML={{ __html: viewingContent.content }}
                />
              </article>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}