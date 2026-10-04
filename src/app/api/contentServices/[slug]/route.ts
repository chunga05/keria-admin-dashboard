import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      slug: string;
    }>;
  }
) {
  try {
    const { slug } = await context.params;

    const decodedSlug = decodeURIComponent(slug);

    const { data, error } = await supabase
      .from("content")
      .select("*")
      .eq("slug", decodedSlug)
      .single();

    if (error) {
      console.error(
        "❌ Lỗi lấy bài viết:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: "Không tìm thấy bài viết",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "❌ API content detail:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Lỗi hệ thống",
      },
      {
        status: 500,
      }
    );
  }
}