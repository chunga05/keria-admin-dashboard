import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import {
  addBannedWordAction,
  bulkInsertBannedWordsAction,
  deleteBannedWordAction,
  toggleHideWishAction,
  deleteWishAction,
} from "@/app/(admin)/actions/adminActions";

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
  const res = await addBannedWordAction(word);
  if (!res.success) throw new Error(res.message);
  return res.data;
}

export async function bulkInsertBannedWords(words: string[]) {
  const res = await bulkInsertBannedWordsAction(words);
  if (!res.success) throw new Error(res.message);
  return {
    insertedCount: res.insertedCount,
    skippedCount: res.skippedCount,
  };
}

export async function deleteBannedWord(id: number) {
  const res = await deleteBannedWordAction(id);
  if (!res.success) throw new Error(res.message);
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
  const res = await toggleHideWishAction(id, currentStatus);
  if (!res.success) throw new Error(res.message);
}

export async function deleteWish(id: number) {
  const res = await deleteWishAction(id);
  if (!res.success) throw new Error(res.message);
}