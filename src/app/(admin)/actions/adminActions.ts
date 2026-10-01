"use server";

// Không còn dùng service_role.
// Dùng @supabase/ssr để tạo server client đọc cookie session của admin.
// RLS tự kiểm tra auth.uid() + role = 'admin' qua hàm is_admin().
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function createAdminClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // Server Actions không cần setAll vì chỉ đọc session
        setAll() {},
      },
    }
  );
}

import { supabaseAdmin } from "@/lib/supabaseClient";

export async function getAdminProfileByUserId(userId: string) {
  const { data } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return data;
}

// ─── User Management ──────────────────────────────────────────────────────────

export async function approveUserAction(userId: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("users")
    .update({ status: "approved" })
    .eq("id", userId);

  if (error) return { success: false, message: error.message };
  return { success: true };
}

export async function rejectUserAction(userId: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("users")
    .update({ status: "rejected" })
    .eq("id", userId);

  if (error) return { success: false, message: error.message };
  return { success: true };
}

export async function banUserAction(userId: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("users")
    .update({ status: "banned" })
    .eq("id", userId);

  if (error) return { success: false, message: error.message };
  return { success: true };
}

export async function reactivateUserAction(userId: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("users")
    .update({ status: "approved" })
    .eq("id", userId);

  if (error) return { success: false, message: error.message };
  return { success: true };
}

// ─── Post Management ──────────────────────────────────────────────────────────

export async function deletePostAction(postId: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId);

  if (error) return { success: false, message: error.message };
  return { success: true };
}

// ─── Frame Management ─────────────────────────────────────────────────────────

export async function deleteFrameAction(frameId: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("avatar_frames")
    .delete()
    .eq("id", frameId);

  if (error) return { success: false, message: error.message };
  return { success: true };
}

// ─── Content Management ───────────────────────────────────────────────────────

export type ContentInput = {
  title: string;
  slug: string;
  category: string;
  media_url: string;
  is_video: boolean;
  content: string;
};

export async function createContentAction(input: ContentInput) {
  const supabase = await createAdminClient();
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

  if (error) return { success: false, message: error.message, data: null };
  return { success: true, message: "", data };
}

export async function updateContentAction(id: string, input: ContentInput) {
  const supabase = await createAdminClient();
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

  if (error) return { success: false, message: error.message, data: null };
  return { success: true, message: "", data };
}

export async function deleteContentAction(id: string) {
  const supabase = await createAdminClient();

  // Lấy media_url trước khi xóa (để xóa file trên R2 nếu cần)
  const { data: record } = await supabase
    .from("content")
    .select("media_url")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("content").delete().eq("id", id);

  if (error) return { success: false, message: error.message, mediaUrl: null };
  return { success: true, message: "", mediaUrl: record?.media_url ?? null };
}

// ─── Project Management ───────────────────────────────────────────────────────

export async function createProjectAction(input: any) {
  const supabase = await createAdminClient();
  const { data, error } = await supabase.from("projects").insert([input]).select();
  if (error) return { success: false, message: error.message, data: null };
  return { success: true, message: "", data };
}

export async function updateProjectAction(id: number, input: any) {
  const supabase = await createAdminClient();
  const { data, error } = await supabase.from("projects").update(input).eq("id", id).select();
  if (error) return { success: false, message: error.message, data: null };
  return { success: true, message: "", data };
}

export async function deleteProjectAction(id: number) {
  const supabase = await createAdminClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { success: false, message: error.message };
  return { success: true, message: "" };
}

// ─── Project Stage Management ─────────────────────────────────────────────────

export async function createProjectStageAction(input: any) {
  const supabase = await createAdminClient();
  const { data, error } = await supabase.from("project_stages").insert([input]).select();
  if (error) return { success: false, message: error.message, data: null };
  return { success: true, message: "", data };
}

export async function updateProjectStageAction(id: number, input: any) {
  const supabase = await createAdminClient();
  const { data, error } = await supabase.from("project_stages").update(input).eq("id", id).select();
  if (error) return { success: false, message: error.message, data: null };
  return { success: true, message: "", data };
}

export async function deleteProjectStageAction(id: number) {
  const supabase = await createAdminClient();
  const { error } = await supabase.from("project_stages").delete().eq("id", id);
  if (error) return { success: false, message: error.message };
  return { success: true, message: "" };
}