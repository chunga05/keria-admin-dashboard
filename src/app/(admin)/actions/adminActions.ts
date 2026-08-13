"use server"; // Bắt buộc phải có dòng này để khai báo đây là code chạy trên Server

import { createClient } from '@supabase/supabase-js';

// Khởi tạo Supabase bằng chìa khóa vạn năng (Service Role Key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function approveUserAction(userId: string) {
  const { error } = await supabaseAdmin
    .from("users")
    .update({ status: "approved" }) // Hoặc "active" tùy hệ thống của bạn
    .eq("id", userId);

  if (error) {
    return { success: false, message: error.message };
  }
  return { success: true };
}

export async function rejectUserAction(userId: string) {
  const { error } = await supabaseAdmin
    .from("users")
    .update({ status: "rejected" })
    .eq("id", userId);

  if (error) {
    return { success: false, message: error.message };
  }
  return { success: true };
}