"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function WishManagementPage() {
  const [wishes, setWishes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State cho Word List Filter
  const [bannedWords, setBannedWords] = useState<any[]>([]);
  const [newWord, setNewWord] = useState("");

  // Phân trang Wish
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalCount, setTotalCount] = useState(0);

  // 1. Hàm lấy danh sách Lời chúc
  const fetchWishes = useCallback(async (page: number) => {
    setLoading(true);
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;

    const { data, count, error } = await supabase
      .from("fan_wishes")
      .select("*", { count: "exact" })
      .range(start, end)
      .order("created_at", { ascending: false });

    if (!error) {
      setWishes(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }, [itemsPerPage]);

  // 2. Hàm lấy danh sách Từ khóa cấm (Word List)
  const fetchBannedWords = useCallback(async () => {
    const { data, error } = await supabase
      .from("banned_words")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setBannedWords(data || []);
    }
  }, []);

  useEffect(() => {
    fetchWishes(currentPage);
    fetchBannedWords();
  }, [currentPage, fetchWishes, fetchBannedWords]);

  // 3. Hàm Thêm từ khóa mới
  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;

    const { error } = await supabase
      .from("banned_words")
      .insert([{ word: newWord.trim().toLowerCase() }]);

    if (error) {
      alert("Lỗi khi thêm từ khóa: " + error.message);
    } else {
      setNewWord("");
      fetchBannedWords(); // Tải lại danh sách từ khóa
    }
  };

  // 4. Hàm Xóa từ khóa
  const handleDeleteWord = async (id: number) => {
    const { error } = await supabase
      .from("banned_words")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Lỗi khi xóa từ khóa: " + error.message);
    } else {
      fetchBannedWords();
    }
  };

  // Các hàm xử lý Wish (Xóa / Ẩn hiện)
  const handleDeleteWish = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa lời chúc này không?")) return;
    await supabase.from("fan_wishes").delete().eq("id", id);
    fetchWishes(currentPage);
  };

  const handleToggleHide = async (id: number, currentStatus: boolean) => {
    await supabase.from("fan_wishes").update({ is_hidden: !currentStatus }).eq("id", id);
    fetchWishes(currentPage);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="space-y-8">
      {/* PHẦN 1: QUẢN LÝ WORD LIST FILTER */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          Quản lý Từ khóa Lọc (Word List Filter)
        </h3>

        {/* Form thêm từ khóa */}
        <form onSubmit={handleAddWord} className="flex gap-3 mb-6">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="Nhập từ khóa cần cấm..."
            className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            className="px-5 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition"
          >
            Thêm từ khóa
          </button>
        </form>

        {/* Danh sách từ khóa dạng thẻ tag */}
        <div className="flex flex-wrap gap-2">
          {bannedWords.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có từ khóa nào trong danh sách lọc.</p>
          ) : (
            bannedWords.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full text-sm font-medium"
              >
                {item.word}
                <button
                  type="button"
                  onClick={() => handleDeleteWord(item.id)}
                  className="text-red-500 hover:text-red-700 font-bold ml-1"
                  title="Xóa từ khóa"
                >
                  &times;
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      {/* PHẦN 2: QUẢN LÝ LỜI CHÚC (WISHES) */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
            Danh sách Lời chúc
          </h3>
          <span className="text-sm text-gray-500">Tổng số: {totalCount} lời chúc</span>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 text-sm">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Người gửi</th>
                  <th className="py-3 px-4">Nội dung</th>
                  <th className="py-3 px-4">Trạng thái ẩn</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                {wishes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-500">
                      Chưa có lời chúc nào.
                    </td>
                  </tr>
                ) : (
                  wishes.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-mono text-gray-500">{item.id}</td>
                      <td className="py-3 px-4 font-medium text-gray-800 dark:text-white">
                        {item.user_id ? (
                          <span className="text-blue-500">Thành viên ({item.user_id.slice(0, 6)}...)</span>
                        ) : (
                          <span className="text-orange-500">{item.guest_name || "Ẩn danh"}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                        {item.content}
                      </td>
                      <td className="py-3 px-4">
                        {item.is_hidden ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Đã ẩn</span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Hiển thị</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-xs">
                        {new Date(item.created_at).toLocaleString("vi-VN")}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleHide(item.id, item.is_hidden)}
                          className={`px-3 py-1 rounded text-white text-xs ${
                            item.is_hidden ? "bg-blue-500 hover:bg-blue-600" : "bg-yellow-500 hover:bg-yellow-600"
                          }`}
                        >
                          {item.is_hidden ? "Hiện" : "Ẩn"}
                        </button>
                        <button
                          onClick={() => handleDeleteWish(item.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Phân trang */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
              <span className="text-sm text-gray-500">
                Trang hiện tại: <strong className="text-gray-800 dark:text-white">{currentPage}</strong> / {totalPages || 1}
              </span>

              {totalPages > 1 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border rounded text-sm disabled:opacity-50 dark:border-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border rounded text-sm disabled:opacity-50 dark:border-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Sau
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}