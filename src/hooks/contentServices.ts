
import { supabase } from "@/lib/supabaseClient";

export type ContentRecord = {
  id: string;
  title: string;
  slug: string;
  category: string;
  media_url: string;
  is_video: boolean;
  content: string;
  created_at?: string;
  updated_at?: string;
};

export type ContentInput = {
  title: string;
  slug: string;
  category: string;
  media_url: string;
  is_video: boolean;
  content: string;
};

// Lấy danh sách content cho admin
export async function getAdminContents(filters: { search?: string; startDate?: string; endDate?: string; category?: string } = {}): Promise<ContentRecord[]> {
  let query = supabase
    .from("content")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.search?.trim()) {
    query = query.ilike('title', `%${filters.search.trim()}%`);
  }
  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate + 'T23:59:59');
  }

  const { data, error } = await query;

  if (error) {
    console.error("getAdminContents:", error);
    throw error;
  }

  return data || [];
}

// Thêm content
export async function createContent(
  input: ContentInput
): Promise<ContentRecord> {
  const { data, error } = await supabase
    .from("content")
    .insert([
      {
        title: input.title,
        slug: input.slug,
        category: input.category,
        media_url: input.media_url,
        is_video: input.is_video,
        content: input.content,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("createContent:", error);
    throw error;
  }

  return data;
}

// Cập nhật content
export async function updateContent(
  id: string,
  input: ContentInput
): Promise<ContentRecord> {
  const { data, error } = await supabase
    .from("content")
    .update({
      title: input.title,
      slug: input.slug,
      category: input.category,
      media_url: input.media_url,
      is_video: input.is_video,
      content: input.content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("updateContent:", error);
    throw error;
  }

  return data;
}

// Xóa content kèm tự động dọn rác trên Storage (nếu có)
export async function deleteContent(id: string) {
  // 1. Lấy thông tin media_url trước khi xóa
  const { data: record } = await supabase
    .from("content")
    .select("media_url")
    .eq("id", id)
    .single();

  // 2. Xóa bản ghi trong database
  const { error } = await supabase
    .from("content")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteContent:", error);
    throw error;
  }

  // 3. Nếu media_url là file thuộc storage bucket "project-contents", tiến hành xóa file
  if (record?.media_url && record.media_url.includes("/project-contents/")) {
    try {
      // Tách lấy đường dẫn tương đối (uploads/ten-file.png)
      const filePath = record.media_url.split("/project-contents/")[1];
      if (filePath) {
        await supabase.storage.from("project-contents").remove([filePath]);
      }
    } catch (storageErr) {
      console.warn("Không thể xóa file trên storage:", storageErr);
    }
  }
}

