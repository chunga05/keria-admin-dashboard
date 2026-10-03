"use client";

import { useEffect, useState, useCallback, useRef, ChangeEvent } from "react";
import {
  FanWish,
  BannedWord,
  getBannedWords,
  addBannedWord,
  bulkInsertBannedWords,
  deleteBannedWord,
  getWishes,
  toggleHideWish,
  deleteWish,
} from "@/hooks/wishService";
import { TableFilter } from "@/components/ui/table/TableFilter";

function Reactions({
  cry,
  wow,
  star,
  heart,
}: {
  cry: number;
  wow: number;
  star: number;
  heart: number;
}) {
  const items = [
    { emoji: "😢", count: cry },
    { emoji: "😮", count: wow },
    { emoji: "⭐", count: star },
    { emoji: "❤️", count: heart },
  ].filter((r) => r.count > 0);

  if (items.length === 0)
    return <span className="text-xs text-gray-300 dark:text-gray-600">—</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((r) => (
        <span
          key={r.emoji}
          className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs"
        >
          {r.emoji} {r.count}
        </span>
      ))}
    </div>
  );
}

export default function WishManagementPage() {
  const [wishes, setWishes] = useState<FanWish[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "visible" | "hidden">("all");
  const [filters, setFilters] = useState<{ search?: string; startDate?: string; endDate?: string }>({});

  // Word List State
  const [bannedWords, setBannedWords] = useState<BannedWord[]>([]);
  const [newWord, setNewWord] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalCount, setTotalCount] = useState(0);

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const fetchWishes = useCallback(
    async (page: number) => {
      setLoading(true);
      try {
        const { wishes: data, totalCount: count } = await getWishes(
          page,
          itemsPerPage,
          filter,
          filters
        );
        setWishes(data);
        setTotalCount(count);
      } catch (err: any) {
        console.error("Lỗi lấy lời chúc:", err.message);
      } finally {
        setLoading(false);
      }
    },
    [filter, filters]
  );

  const fetchBannedWordsData = useCallback(async () => {
    try {
      const data = await getBannedWords();
      setBannedWords(data);
    } catch (err: any) {
      console.error("Lỗi lấy danh sách từ cấm:", err.message);
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, filters]);

  useEffect(() => {
    fetchBannedWordsData();
  }, [fetchBannedWordsData]);

  useEffect(() => {
    fetchWishes(currentPage);
  }, [currentPage, fetchWishes]);

  // ── Word list actions ──────────────────────────────────────────────────────
  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;

    try {
      await addBannedWord(newWord);
      setNewWord("");
      fetchBannedWordsData();
    } catch (error: any) {
      alert("Lỗi: " + error.message);
    }
  };

  const handleDeleteWord = async (id: number) => {
    try {
      await deleteBannedWord(id);
      fetchBannedWordsData();
    } catch (error: any) {
      alert("Lỗi xoá từ: " + error.message);
    }
  };

  // Nhập từ file text (.txt, .csv)
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) {
        setIsUploading(false);
        return;
      }

      // Tách các từ qua xuống dòng (\n, \r) hoặc dấu phẩy (,)
      const parsedWords = content
        .split(/[\r\n,]+/)
        .map((w) => w.trim().toLowerCase())
        .filter((w) => w.length > 0);

      if (parsedWords.length === 0) {
        alert("File không chứa từ khóa hợp lệ.");
        setIsUploading(false);
        return;
      }

      try {
        const res = await bulkInsertBannedWords(parsedWords);
        
        if (res.insertedCount === 0) {
          alert(`Tất cả ${res.skippedCount} từ khóa trong file đều đã tồn tại từ trước!`);
        } else {
          alert(
            `Thành công!\n- Đã thêm mới: ${res.insertedCount} từ\n- Đã bỏ qua: ${res.skippedCount} từ bị trùng`
          );
        }

        fetchBannedWordsData();
      } catch (err: any) {
        alert("Lỗi nhập dữ liệu: " + err.message);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsText(file);
  };

  // ── Wish actions ───────────────────────────────────────────────────────────
  const handleDeleteWish = async (id: number) => {
    if (!confirm("Xoá lời chúc này?")) return;
    try {
      await deleteWish(id);
      fetchWishes(currentPage);
    } catch (err: any) {
      alert("Lỗi xoá lời chúc: " + err.message);
    }
  };

  const handleToggleHide = async (id: number, currentStatus: boolean) => {
    try {
      await toggleHideWish(id, currentStatus);
      fetchWishes(currentPage);
    } catch (err: any) {
      alert("Lỗi cập nhật trạng thái: " + err.message);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-800 dark:text-white">
          Quản lý Lời chúc
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Kiểm duyệt và lọc lời chúc từ fan
        </p>
      </div>

      {/* ── Word List Filter ── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
            🚫 Từ khóa Lọc (Word List Filter)
          </h3>
          <span className="text-xs text-gray-400">
            Tổng: {bannedWords.length} từ
          </span>
        </div>

        <form onSubmit={handleAddWord} className="flex flex-wrap gap-3 mb-5">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="Nhập từ khóa cần cấm..."
            className="flex-1 min-w-[200px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition shadow-sm"
          >
            Thêm
          </button>

          {/* Import File Text Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="shrink-0 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition disabled:opacity-50"
          >
            {isUploading ? "Đang xử lý..." : "📁 Nhập file text"}
          </button>
        </form>

        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
          {bannedWords.length === 0 ? (
            <p className="text-sm text-gray-400">Chưa có từ khóa nào.</p>
          ) : (
            bannedWords.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {item.word}
                <button
                  type="button"
                  onClick={() => handleDeleteWord(item.id)}
                  className="flex h-4 w-4 items-center justify-center rounded-full text-red-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 transition"
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      <TableFilter onFilterChange={setFilters} placeholder="Tìm nội dung, tác giả..." />

      {/* ── Wishes Table ── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold text-gray-800 dark:text-white">
              💌 Danh sách Lời chúc
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Tổng: {totalCount} lời chúc</p>
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
            {(["all", "visible", "hidden"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  filter === f
                    ? "bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                {f === "all" ? "Tất cả" : f === "visible" ? "Đang hiện" : "Đã ẩn"}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-50 text-xs uppercase text-gray-400 dark:border-gray-800/60">
                <th className="px-6 py-3 font-semibold">Người gửi</th>
                <th className="px-6 py-3 font-semibold">Nội dung</th>
                <th className="px-6 py-3 font-semibold hidden md:table-cell">Reactions</th>
                <th className="px-6 py-3 font-semibold hidden sm:table-cell">Trạng thái</th>
                <th className="px-6 py-3 font-semibold hidden lg:table-cell">Thời gian</th>
                <th className="px-6 py-3 font-semibold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/40">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="flex gap-3">
                        <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="flex-1 space-y-2 py-0.5">
                          <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                          <div className="h-3 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : wishes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                    Không có lời chúc nào.
                  </td>
                </tr>
              ) : (
                wishes.map((item) => {
                  const sender = item.users;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4">
                        {sender ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={sender.avatar_url || "/images/user/user-01.png"}
                              referrerPolicy="no-referrer"
                              alt={sender.display_name}
                              className="h-8 w-8 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                            />
                            <div>
                              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                {sender.display_name}
                              </p>
                              <p className="text-xs text-gray-400 font-mono">@{sender.username}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-500 text-xs font-bold">
                              G
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                {item.guest_name || "Ẩn danh"}
                              </p>
                              <p className="text-xs text-gray-400">Khách</p>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 max-w-[200px]">
                        <p className="line-clamp-2 text-sm text-gray-700 dark:text-gray-300">
                          {item.content}
                        </p>
                      </td>

                      <td className="px-6 py-4 hidden md:table-cell">
                        <Reactions
                          cry={item.react_cry ?? 0}
                          wow={item.react_wow ?? 0}
                          star={item.react_star ?? 0}
                          heart={item.react_heart ?? 0}
                        />
                      </td>

                      <td className="px-6 py-4 hidden sm:table-cell">
                        {item.is_hidden ? (
                          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            Đã ẩn
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Hiển thị
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-xs text-gray-400 hidden lg:table-cell">
                        {new Date(item.created_at).toLocaleString("vi-VN")}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleHide(item.id, item.is_hidden)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                              item.is_hidden
                                ? "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
                                : "bg-yellow-50 text-yellow-600 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400"
                            }`}
                          >
                            {item.is_hidden ? "Hiện" : "Ẩn"}
                          </button>
                          <button
                            onClick={() => handleDeleteWish(item.id)}
                            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition"
                          >
                            Xoá
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 dark:border-gray-800">
            <span className="text-xs text-gray-400">
              Trang <strong className="text-gray-600 dark:text-gray-300">{currentPage}</strong> / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                ← Trước
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}