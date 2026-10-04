import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    // Gọi dữ liệu từ bảng 'content'
    const { data, error } = await supabase
      .from("content")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Lỗi Supabase khi tải content:", error);
      return NextResponse.json(
        { error: "Lỗi khi lấy dữ liệu từ cơ sở dữ liệu." },
        { status: 500 }
      );
    }

    // Trả về dữ liệu thành công
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Lỗi Server API:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi hệ thống nội bộ." },
      { status: 500 }
    );
  }
}