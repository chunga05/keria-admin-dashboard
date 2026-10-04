import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2 } from '@/lib/r2';
import { verifyAccessToken } from '@/lib/jwt';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * POST /api/upload/presign
 *
 * Tạo Presigned URL cho phép Client (cả User Web và Admin Web) tải tệp trực tiếp lên Cloudflare R2
 * Body: { filename: string, contentType: string, folder?: string, size?: number }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. KIỂM TRA XÁC THỰC (AUTHENTICATION)
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
        { error: 'Unauthorized: Vui lòng đăng nhập trước khi tải tệp lên!' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const payload = await verifyAccessToken(token);
    if (!payload?.sub) {
      return NextResponse.json(
        { error: 'Unauthorized: Phiên đăng nhập không hợp lệ hoặc đã hết hạn!' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const isAdmin =
      (payload.role === 'admin' || payload.app_role === 'admin') &&
      payload.status === 'approved';

    // 2. ĐỌC THÔNG SỐ TỪ REQUEST BODY
    const body = await request.json().catch(() => ({}));
    const { filename, contentType, folder: requestedFolder, size } = body;

    if (!filename || typeof filename !== 'string') {
      return NextResponse.json(
        { error: 'Thiếu tên tệp tin (filename)!' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const ext = filename.split('.').pop()?.toLowerCase() || '';

    // 3. PHÂN QUYỀN VÀ RÀNG BUỘC THEO ROLE
    let folder = 'uploads';

    if (!isAdmin) {
      // Phía User thường:
      // - Chỉ được phép upload vào thư mục "proofs"
      // - Chỉ được phép tải ảnh (JPG, PNG, WEBP)
      // - Giới hạn dung lượng tối đa 10MB
      folder = 'proofs';

      const ALLOWED_USER_EXTS = ['jpg', 'jpeg', 'png', 'webp'];
      if (!ALLOWED_USER_EXTS.includes(ext) || !contentType?.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Người dùng chỉ được phép tải ảnh định dạng JPG, PNG hoặc WEBP!' },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const MAX_USER_SIZE = 10 * 1024 * 1024; // 10MB
      if (size && Number(size) > MAX_USER_SIZE) {
        return NextResponse.json(
          { error: 'Dung lượng ảnh vượt quá giới hạn 10MB!' },
          { status: 400, headers: CORS_HEADERS }
        );
      }
    } else {
      // Phía Admin:
      // - Tự do chọn folder (làm sạch ký tự đặc biệt)
      // - KHÔNG GIỚI HẠN dung lượng
      if (requestedFolder && typeof requestedFolder === 'string') {
        folder = requestedFolder.replace(/[^a-zA-Z0-9_-]/g, '') || 'uploads';
      }
    }

    // 4. KIỂM TRA CẤU HÌNH R2
    const r2PublicUrl = process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    if (
      (!process.env.R2_ACCOUNT_ID && !process.env.R2_ENDPOINT) ||
      !process.env.R2_ACCESS_KEY_ID ||
      !process.env.R2_SECRET_ACCESS_KEY ||
      !process.env.R2_BUCKET_NAME ||
      !r2PublicUrl
    ) {
      console.error('Thiếu cấu hình R2 trên Admin Server.');
      return NextResponse.json(
        { error: 'Cấu hình R2 chưa đầy đủ trên server.' },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // 5. TẠO OBJECT KEY VÀ PRESIGNED PUT URL (Hạn dùng 10 phút)
    const uniqueName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext || 'bin'}`;
    const key = `${folder}/${uniqueName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: contentType || 'application/octet-stream',
    });

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 600 });
    const publicDomain = r2PublicUrl.replace(/\/$/, '');
    const publicUrl = `${publicDomain}/${key}`;

    return NextResponse.json(
      {
        success: true,
        uploadUrl,
        publicUrl,
        key,
      },
      {
        status: 200,
        headers: CORS_HEADERS,
      }
    );
  } catch (error: any) {
    console.error('Lỗi API /api/upload/presign:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi hệ thống khi tạo Presigned URL.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
