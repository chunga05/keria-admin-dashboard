import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { uploadFileToR2 } from '../lib/uploadR2Client';

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

      // 2. LƯU THÔNG TIN VÀO BẢNG avatar_frames TRONG DATABASE
      const { error: dbError } = await supabase
        .from('avatar_frames')
        .insert([{ id: id, name: name, image_url: imageUrl }]);

      if (dbError) throw dbError;

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