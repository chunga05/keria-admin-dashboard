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