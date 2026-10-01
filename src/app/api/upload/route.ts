import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2';

/**
 * POST /api/upload
 * Body: FormData với field "file" (File) và "folder" (string, tùy chọn)
 *
 * Trả về: { url: string } - Public URL của file trên Cloudflare R2
 *
 * Dùng cho: upload ảnh bìa content, ảnh inline trong editor, khung viền...
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string | null) || 'uploads';

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy file trong request.' }, { status: 400 });
    }

    // Kiểm tra biến môi trường R2
    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME || !process.env.R2_PUBLIC_URL) {
      console.error('Thiếu biến môi trường R2. Vui lòng kiểm tra .env.local');
      return NextResponse.json({ error: 'Cấu hình R2 chưa đầy đủ trên server.' }, { status: 500 });
    }

    // Tạo key duy nhất: folder/timestamp-uuid.ext
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const uniqueName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${fileExt}`;
    const key = `${folder}/${uniqueName}`;

    // Đọc nội dung file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload lên R2
    const publicUrl = await uploadToR2(key, buffer, file.type || 'application/octet-stream');

    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (error: any) {
    console.error('Lỗi API /api/upload:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi hệ thống khi upload file.' },
      { status: 500 }
    );
  }
}
