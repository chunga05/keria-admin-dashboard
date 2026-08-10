import { useState } from 'react';
// NHỚ ĐỔI ĐƯỜNG DẪN NÀY ĐÚNG VỚI FILE SUPABASE CỦA BẠN (Ví dụ: '../utils/supabase' hoặc thư mục tương ứng)
import { supabase } from '../lib/supabaseClient'; 

export const useAdminFrames = () => {
  const [isUploading, setIsUploading] = useState(false);

  const addFrame = async (id: string, name: string, file: File | null) => {
    if (!id || !name || !file) {
      alert("Vui lòng điền đủ ID, Tên khung và chọn file ảnh!");
      return;
    }

    setIsUploading(true);
    try {
      // 1. TẠO TÊN FILE DUY NHẤT (tránh trùng lặp nếu up 2 ảnh trùng tên)
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `frames/${fileName}`;

      // 2. UPLOAD ẢNH LÊN SUPABASE STORAGE
      const { error: uploadError } = await supabase.storage
        .from('avatar-frames')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 3. LẤY ĐƯỜNG DẪN PUBLIC CỦA ẢNH VỪA UPLOAD
      const { data: publicUrlData } = supabase.storage
        .from('avatar-frames')
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;

      // 4. LƯU THÔNG TIN VÀO BẢNG avatar_frames TRONG DATABASE
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