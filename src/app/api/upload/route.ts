import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { uploadToR2 } from '@/lib/r2';
import { verifyAccessToken } from '@/lib/jwt';

/**
 * POST /api/upload
 * Body: FormData với field "file" (File) và "folder" (string, tùy chọn)
 * Quyền: Chỉ dành riêng cho Quản trị viên (Admin)
 * Giới hạn dung lượng: Không giới hạn cho Admin
 *
 * Trả về: { url: string } - Public URL của file trên Cloudflare R2
 */
export async function POST(request: NextRequest) {
  try {
    // 1. KIỂM TRA QUYỀN HẠN ADMIN (AUTHENTICATION & AUTHORIZATION)
    const cookieStore = await cookies();
    let token =
      cookieStore.get('dkvn_at')?.value ||
      cookieStore.get('dkvn_admin_at')?.value;

    const authHeader = request.headers.get('Authorization');
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: Bạn cần đăng nhập để tải tệp lên.' },
        { status: 401 }
      );
    }

    const payload = await verifyAccessToken(token);
    const isAdmin =
      payload &&
      (payload.role === 'admin' || payload.app_role === 'admin') &&
      payload.status === 'approved';

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Bạn không có quyền quản trị viên để thực hiện thao tác này.' },
        { status: 403 }
      );
    }

    // 2. LẤY FILE VÀ FOLDER TỪ FORMDATA
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const rawFolder = (formData.get('folder') as string | null) || 'uploads';

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy file trong request.' }, { status: 400 });
    }

    // Làm sạch tên folder tránh path traversal
    const folder = rawFolder.replace(/[^a-zA-Z0-9_-]/g, '') || 'uploads';

    // 3. KIỂM TRA BIẾN MÔI TRƯỜNG R2 (Hỗ trợ cả R2_PUBLIC_URL và NEXT_PUBLIC_R2_PUBLIC_URL)
    const r2PublicUrl = process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    if (
      (!process.env.R2_ACCOUNT_ID && !process.env.R2_ENDPOINT) ||
      !process.env.R2_ACCESS_KEY_ID ||
      !process.env.R2_SECRET_ACCESS_KEY ||
      !process.env.R2_BUCKET_NAME ||
      !r2PublicUrl
    ) {
      console.error('Thiếu biến môi trường R2. Vui lòng kiểm tra .env.local');
      return NextResponse.json({ error: 'Cấu hình R2 chưa đầy đủ trên server.' }, { status: 500 });
    }

    // 4. TẠO KEY DUY NHẤT: folder/timestamp-uuid.ext
    // Lưu ý: Phía Admin không giới hạn dung lượng file theo yêu cầu nghiệp vụ
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const uniqueName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${fileExt}`;
    const key = `${folder}/${uniqueName}`;

    // 5. ĐỌC NỘI DUNG VÀ UPLOAD LÊN R2
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

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
