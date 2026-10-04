import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteR2FileByUrl } from '@/lib/r2';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAccessToken } from '@/lib/jwt';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 0. KIỂM TRA QUYỀN HẠN ADMIN
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
        { error: 'Unauthorized: Bạn cần đăng nhập để duyệt yêu cầu nhận dấu.' },
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

    const { id } = await params;
    const requestId = Number(id);

    if (!requestId || isNaN(requestId)) {
      return NextResponse.json({ error: 'ID yêu cầu không hợp lệ!' }, { status: 400 });
    }

    const body = await request.json();
    const { action, adminNote } = body;

    if (!['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'Hành động không hợp lệ!' }, { status: 400 });
    }

    // 1. Lấy thông tin yêu cầu cần duyệt
    const { data: requestItem, error: fetchError } = await supabaseAdmin
      .from('stamp_requests')
      .select('id, user_id, stage_id, evidence_image_url, status')
      .eq('id', requestId)
      .maybeSingle();

    if (fetchError) {
      console.error('Lỗi Supabase khi truy vấn ID:', fetchError.message);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!requestItem) {
      return NextResponse.json({ error: `Không tìm thấy yêu cầu có ID = ${requestId}!` }, { status: 404 });
    }

    // 2. Cập nhật trạng thái yêu cầu
    const { error: updateError } = await supabaseAdmin
      .from('stamp_requests')
      .update({
        status: action,
        admin_note: adminNote || null,
        evidence_image_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Lỗi cập nhật stamp_requests:', updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 3. Nếu duyệt thành công -> Lấy passport của user rồi cấp dấu vào passport_stamps
    if (action === 'approved') {
      const { data: passport } = await supabaseAdmin
        .from('passports')
        .select('id')
        .eq('user_id', requestItem.user_id)
        .maybeSingle();

      if (passport) {
        const { data: existingStamp } = await supabaseAdmin
          .from('passport_stamps')
          .select('id')
          .eq('passport_id', passport.id)
          .eq('stage_id', requestItem.stage_id)
          .maybeSingle();

        if (!existingStamp) {
          const { error: insertStampError } = await supabaseAdmin
            .from('passport_stamps')
            .insert({
              passport_id: passport.id,
              stage_id: requestItem.stage_id,
              request_id: requestItem.id,
              received_at: new Date().toISOString(),
            });

          if (insertStampError) {
            console.warn('Cảnh báo cấp passport_stamps thất bại:', insertStampError.message);
          }
        }
      } else {
        console.warn(`User ${requestItem.user_id} chưa có bảng passports!`);
      }
    }

    // 4. Xóa ảnh trên Cloudflare R2 sau khi xử lý xong
    if (requestItem.evidence_image_url) {
      await deleteR2FileByUrl(requestItem.evidence_image_url);
    }

    return NextResponse.json({
      success: true,
      message: `Đã ${action === 'approved' ? 'duyệt' : 'từ chối'} và dọn dẹp dung lượng thành công!`,
    });
  } catch (err: any) {
    console.error('API Error /api/stamp-requests/[id]:', err);
    return NextResponse.json(
      { error: err?.message || 'Lỗi hệ thống khi xử lý duyệt yêu cầu' },
      { status: 500 }
    );
  }
}