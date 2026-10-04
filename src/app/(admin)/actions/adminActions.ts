"use server";

import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Admin Client:
// VÃ¬ Admin app sá»­ dá»¥ng custom JWT (dkvn_at) vá»›i role='admin', 
// @supabase/ssr khÃ´ng thá»ƒ dÃ¹ng custom JWT nÃ y trá»±c tiáº¿p cho RLS 
// (do pg_roles khÃ´ng cÃ³ role 'admin' vÃ  thiáº¿u session chuáº©n).
// Do Ä‘Ã³, ta verify custom JWT trÆ°á»›c, sau Ä‘Ã³ dÃ¹ng supabaseAdmin 
// (service_role) Ä‘á»ƒ thá»±c hiá»‡n thao tÃ¡c. RLS policy á»Ÿ database 
// váº«n báº£o vá»‡ an toÃ n trÆ°á»›c cÃ¡c request trá»±c tiáº¿p tá»« client/app chÃ­nh.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function createAdminClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get("dkvn_at")?.value || cookieStore.get("dkvn_admin_at")?.value;

  if (!token) {
    throw new Error("Unauthorized: Missing admin token");
  }

  const payload = await verifyAccessToken(token);
  if (!payload || (payload.role !== "admin" && payload.app_role !== "admin") || payload.status !== "approved") {
    throw new Error("Forbidden: Invalid admin token or insufficient permissions");
  }

  return supabaseAdmin;
}

export async function getAdminProfileByUserId(userId: string) {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return data;
}

// â”€â”€â”€ User Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ Post Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function deletePostAction(postId: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId);

  if (error) return { success: false, message: error.message };
  return { success: true };
}

// â”€â”€â”€ Frame Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function deleteFrameAction(frameId: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("avatar_frames")
    .delete()
    .eq("id", frameId);

  if (error) return { success: false, message: error.message };
  return { success: true };
}

// â”€â”€â”€ Content Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  // Láº¥y media_url trÆ°á»›c khi xÃ³a (Ä‘á»ƒ xÃ³a file trÃªn R2 náº¿u cáº§n)
  const { data: record } = await supabase
    .from("content")
    .select("media_url")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("content").delete().eq("id", id);

  if (error) return { success: false, message: error.message, mediaUrl: null };
  return { success: true, message: "", mediaUrl: record?.media_url ?? null };
}

// â”€â”€â”€ Project Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ Project Stage Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ Facebook Links Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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





