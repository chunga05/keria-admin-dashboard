import { NextRequest, NextResponse } from 'next/server';
import { deleteR2FileByUrl } from '@/lib/r2';

/**
 * DELETE /api/upload/delete
 * Body: { url: string } - Public URL của file cần xóa trên R2
 */
export async function DELETE(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Thiếu URL file.' }, { status: 400 });
    }

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
