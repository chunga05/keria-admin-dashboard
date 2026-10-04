import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteR2FileByUrl } from '@/lib/r2';
import { verifyAccessToken } from '@/lib/jwt';

/**
 * DELETE /api/upload/delete
 * Body: { url: string } - Public URL của file cần xóa trên R2
 * Quyền: Chỉ dành riêng cho Quản trị viên (Admin)
 */
export async function DELETE(request: NextRequest) {
  try {
    // 1. KIỂM TRA QUYỀN HẠN ADMIN
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
        { error: 'Unauthorized: Bạn cần đăng nhập để xóa tệp.' },
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
        { error: 'Forbidden: Bạn không có quyền quản trị viên để xóa tệp.' },
        { status: 403 }
      );
    }

    // 2. LẤY URL VÀ KIỂM TRA HỢP LỆ
    const { url } = await request.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Thiếu URL file cần xóa.' }, { status: 400 });
    }

    // Xác thực URL thuộc domain R2 của hệ thống để phòng tránh xóa file ngoài luồng
    const r2PublicUrl = process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    if (r2PublicUrl && !url.startsWith(r2PublicUrl.replace(/\/$/, '')) && !url.includes('.r2.dev') && !url.includes('.r2.cloudflarestorage.com')) {
      return NextResponse.json(
        { error: 'URL không thuộc dịch vụ lưu trữ R2 của hệ thống!' },
        { status: 400 }
      );
    }

    // 3. THỰC HIỆN XÓA TỆP
    await deleteR2FileByUrl(url);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Lỗi API /api/upload/delete:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi khi xóa file trên R2.' },
      { status: 500 }
    );
  }
}
