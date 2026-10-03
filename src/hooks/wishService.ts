import { supabase } from "@/lib/supabaseClient";

export interface WishUser {
  display_name: string;
  username: string;
  avatar_url: string | null;
}

export interface FanWish {
  id: number;
  content: string;
  guest_name?: string;
  is_hidden: boolean;
  react_cry: number;
  react_wow: number;
  react_star: number;
  react_heart: number;
  created_at: string;
  users?: WishUser | null;
}

export interface BannedWord {
  id: number;
  word: string;
  created_at: string;
}

// ── Banned Words API ────────────────────────────────────────────────────────
export async function getBannedWords(): Promise<BannedWord[]> {
  const { data, error } = await supabase
    .from("banned_words")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addBannedWord(word: string) {
  const cleanWord = word.trim().toLowerCase();
  const { data, error } = await supabase
    .from("banned_words")
    .insert([{ word: cleanWord }]);

  if (error) throw error;
  return data;
}

export async function bulkInsertBannedWords(words: string[]) {
  // 1. Chuẩn hóa & loại bỏ các từ bị trùng lặp ngay trong file vừa tải lên
  const cleanWords = Array.from(
    new Set(words.map((w) => w.trim().toLowerCase()))
  ).filter((w) => w.length > 0);

  if (cleanWords.length === 0) {
    return { insertedCount: 0, skippedCount: 0 };
  }

  // 2. Lấy danh sách các từ đã tồn tại sẵn trong database
  const { data: existingData, error: fetchError } = await supabase
    .from("banned_words")
    .select("word");

  if (fetchError) throw fetchError;

  const existingWordsSet = new Set(
    (existingData || []).map((item) => item.word.toLowerCase())
  );

  // 3. Tự động bỏ qua các từ đã tồn tại, chỉ giữ lại từ mới
  const newWords = cleanWords.filter((word) => !existingWordsSet.has(word));
  const skippedCount = cleanWords.length - newWords.length;

  // Nếu không có từ mới nào cần thêm
  if (newWords.length === 0) {
    return { insertedCount: 0, skippedCount };
  }

  // 4. Chỉ chèn những từ chưa từng có trong DB
  const payload = newWords.map((word) => ({ word }));
  const { data, error: insertError } = await supabase
    .from("banned_words")
    .insert(payload);

  if (insertError) throw insertError;

  return {
    insertedCount: newWords.length,
    skippedCount,
  };
}

export async function deleteBannedWord(id: number) {
  const { error } = await supabase.from("banned_words").delete().eq("id", id);
  if (error) throw error;
}

// ── Wishes API ─────────────────────────────────────────────────────────────
export async function getWishes(
  page: number,
  itemsPerPage: number,
  filter: "all" | "visible" | "hidden",
  filters: { search?: string; startDate?: string; endDate?: string } = {}
) {
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage - 1;

  let query = supabase
    .from("fan_wishes")
    // 👉 Thêm !user_id ngay sau users:
    .select("*, users!user_id(display_name, username, avatar_url)", { count: "exact" })
    .range(start, end)
    .order("created_at", { ascending: false });

  if (filter === "visible") query = query.eq("is_hidden", false);
  if (filter === "hidden") query = query.eq("is_hidden", true);

  if (filters.search?.trim()) {
    query = query.or(`content.ilike.%${filters.search.trim()}%,guest_name.ilike.%${filters.search.trim()}%`);
  }
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate + 'T23:59:59');
  }

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    wishes: (data as FanWish[]) || [],
    totalCount: count || 0,
  };
}

export async function toggleHideWish(id: number, currentStatus: boolean) {
  const { error } = await supabase
    .from("fan_wishes")
    .update({ is_hidden: !currentStatus })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteWish(id: number) {
  const { error } = await supabase.from("fan_wishes").delete().eq("id", id);
  if (error) throw error;
}