"use server";

import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ─────────────────────────────────────────────────────────────
// Admin Client:
// Vì Admin app sử dụng custom JWT (dkvn_at) với role='admin', 
// @supabase/ssr không thể dùng custom JWT này trực tiếp cho RLS 
// (do pg_roles không có role 'admin' và thiếu session chuẩn).
// Do đó, ta verify custom JWT trước, sau đó dùng supabaseAdmin 
// (service_role) để thực hiện thao tác. RLS policy ở database 
// vẫn bảo vệ an toàn trước các request trực tiếp từ client/app chính.
// ─────────────────────────────────────────────────────────────
async function createAdminClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get("dkvn_at")?.value || cookieStore.get("dkvn_admin_at")?.value;

  if (!token) {
    throw new Error("Unauthorized: Missing admin token");
  }

  const payload = await verifyAccessToken(token);
  if (!payload || payload.role !== "admin" || payload.status !== "approved") {
    throw new Error("Forbidden: Invalid admin token or insufficient permissions");
  }

  return supabaseAdmin;
}

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

// ── Facebook Links Management ──────────────────────────────────

export async function getFacebookLinksAction() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("facebook_links")
    .select("id, title, url, thumbnail_url, created_at")
    .order("created_at", { ascending: false });
  if (error) return { success: false, message: error.message, data: null };
  return { success: true, message: "", data };
}

export async function createFacebookLinkAction(input: {
  title?: string | null;
  url: string;
  thumbnail_url?: string | null;
}) {
  const supabase = await createAdminClient();
  const { error } = await supabase.from("facebook_links").insert([input]);
  if (error) return { success: false, message: error.message };
  return { success: true, message: "" };
}

export async function updateFacebookLinkThumbnailAction(id: string, thumbnail_url: string | null) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("facebook_links")
    .update({ thumbnail_url })
    .eq("id", id);
  if (error) return { success: false, message: error.message };
  return { success: true, message: "" };
}

export async function deleteFacebookLinkAction(id: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase.from("facebook_links").delete().eq("id", id);
  if (error) return { success: false, message: error.message };
  return { success: true, message: "" };
}
