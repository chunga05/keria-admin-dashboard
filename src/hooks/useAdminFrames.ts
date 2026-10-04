import { useState } from 'react';
import { uploadFileToR2 } from '../lib/uploadR2Client';
import { createFrameAction } from '@/app/(admin)/actions/adminActions';

export const useAdminFrames = () => {
  const [isUploading, setIsUploading] = useState(false);

  const addFrame = async (id: string, name: string, file: File | null) => {
    if (!id || !name || !file) {
      alert("Vui lòng điền đủ ID, Tên khung và chọn file ảnh!");
      return;
    }

    setIsUploading(true);
    try {
      // 1. UPLOAD ẢNH LÊN CLOUDFLARE R2 (qua API Route server-side)
      //    folder "frames" trong R2 bucket
      const imageUrl = await uploadFileToR2(file, 'frames');

      // 2. LƯU THÔNG TIN VÀO BẢNG avatar_frames QUA SERVER ACTION
      const res = await createFrameAction({ id, name, image_url: imageUrl });
      if (!res.success) throw new Error(res.message);

      alert("Thêm khung viền mới thành công rực rỡ! 🎉");

    } catch (error: any) {
      console.error("Lỗi khi thêm khung viền:", error);
      alert("Lỗi rồi: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return { addFrame, isUploading };
};