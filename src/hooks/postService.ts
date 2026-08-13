import { supabase } from "@/lib/supabaseClient";

export interface Post {
  id: string;
  content: string;
  image_urls: string[];
  video_url: string | null;
  created_at: string;
}

// Hàm lấy danh sách bài viết
export async function getPosts(): Promise<{ data: Post[] | null; error: any }> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  return { data, error };
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

// Hàm tạo bài viết mới
export async function createPost(postData: {
  content: string;
  image_urls: string[];
  video_url: string | null;
}) {
  const { error } = await supabase.from("posts").insert([postData]);
  if (error) throw error;
  return true;
}