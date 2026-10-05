import {
  getBannedWordsAction,
  addBannedWordAction,
  bulkInsertBannedWordsAction,
  deleteBannedWordAction,
  getWishesAction,
  toggleHideWishAction,
  deleteWishAction,
  type WishUser,
  type FanWish,
  type BannedWord,
} from "@/app/(admin)/actions/adminActions";

export type { WishUser, FanWish, BannedWord };

// ── Banned Words API ────────────────────────────────────────────────────────
export async function getBannedWords(): Promise<BannedWord[]> {
  return await getBannedWordsAction();
}

export async function addBannedWord(word: string) {
  return await addBannedWordAction(word);
}

export async function bulkInsertBannedWords(words: string[]) {
  return await bulkInsertBannedWordsAction(words);
}

export async function deleteBannedWord(id: number) {
  return await deleteBannedWordAction(id);
}

// ── Wishes API ─────────────────────────────────────────────────────────────
export async function getWishes(
  page: number,
  itemsPerPage: number,
  filter: "all" | "visible" | "hidden",
  filters: { search?: string; startDate?: string; endDate?: string } = {}
) {
  return await getWishesAction(page, itemsPerPage, filter, filters);
}

export async function toggleHideWish(id: number, currentStatus: boolean) {
  return await toggleHideWishAction(id, currentStatus);
}

export async function deleteWish(id: number) {
  return await deleteWishAction(id);
}