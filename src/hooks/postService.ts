import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { createPostAction, deletePostAction } from "@/app/(admin)/actions/adminActions";

export interface Post {
  id: string;
  content: string;
  image_urls: string[];
  video_url: string | null;
  likes_count: number;
  created_at: string;
}

// Hàm lấy danh sách bài viết — có phân trang, chỉ lấy cột cần thiết
export async function getPosts(
  page = 1,
  pageSize = 20,
  filters: { search?: string; startDate?: string; endDate?: string } = {}
): Promise<{ data: Post[] | null; error: any; totalCount: number | null }> {
  const from = (page - 1) * pageSize;
  let query = supabase
    .from("posts")
    .select("id, content, image_urls, video_url, likes_count, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (filters.search?.trim()) {
    query = query.ilike('content', `%${filters.search.trim()}%`);
  }
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate + 'T23:59:59');
  }

  const { data, error, count } = await query;

  return { data, error, totalCount: count };
}

// Hàm upload file lên Storage (Hỗ trợ ảnh và video)
export async function uploadMediaFile(file: File, folder: "images" | "videos"): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("post-media")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage
    .from("post-media")
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

// Hàm tạo bài viết mới (chạy qua Server Action để có đặc quyền service_role và bypass RLS)
export async function createPost(postData: {
  content: string;
  image_urls: string[];
  video_url: string | null;
}) {
  const res = await createPostAction(postData);
  if (!res.success) throw new Error(res.message);
  return true;
}

// Hàm xoá bài viết (chạy qua Server Action)
export async function deletePost(postId: string): Promise<{ success: boolean; message?: string }> {
  return await deletePostAction(postId);
}