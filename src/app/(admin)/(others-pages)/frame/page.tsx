"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAdminFrames } from "../../../../hooks/useAdminFrames"; 
import { supabase } from "../../../../lib/supabaseClient"; 

export default function AdminFramesPage() {
  const { addFrame, isUploading } = useAdminFrames();
  
  // State cho Form thêm mới
  const [frameId, setFrameId] = useState("");
  const [frameName, setFrameName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // State cho Danh sách hiển thị
  const [frames, setFrames] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hàm lấy danh sách khung viền từ bảng avatar_frames
  const fetchFrames = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("avatar_frames").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Lỗi lấy danh sách khung:", error);
    } else if (data) {
      setFrames(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchFrames();
  }, []);

  // Hàm xử lý khi bấm nút "Thêm khung viền"
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addFrame(frameId, frameName, selectedFile);
    
    // Sau khi thêm thành công -> Reset form và load lại danh sách
    setFrameId("");
    setFrameName("");
    setSelectedFile(null);
    // Reset file input UI
    const fileInput = document.getElementById("file-upload") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
    
    fetchFrames();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-8 text-3xl font-black text-gray-800">🛠 Quản Lý Khung Viền</h1>

        <div className="grid gap-8 md:grid-cols-3">
          
          {/* ================= CỘT TRÁI: FORM THÊM MỚI ================= */}
          <div className="col-span-1 rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="mb-6 text-xl font-bold text-gray-800">Thêm Khung Mới</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Mã ID Khung (viết liền, ko dấu)</label>
                <input 
                  type="text" 
                  required
                  placeholder="VD: wisteria_birds" 
                  value={frameId} 
                  onChange={(e) => setFrameId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-[#FF76C3]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Tên Hiển Thị</label>
                <input 
                  type="text" 
                  required
                  placeholder="VD: Hoa Tử Đằng" 
                  value={frameName} 
                  onChange={(e) => setFrameName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-[#FF76C3]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Tải ảnh lên (Nền trong suốt)</label>
                <input 
                  type="file" 
                  id="file-upload"
                  accept="image/png, image/gif, image/webp"
                  required
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-pink-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-pink-700 hover:file:bg-pink-100"
                />
              </div>

              <button 
                type="submit" 
                disabled={isUploading}
                className={`w-full rounded-lg py-3 font-bold text-white transition-all ${isUploading ? "bg-gray-400 cursor-not-allowed" : "bg-[#FF76C3] hover:bg-pink-600"}`}
              >
                {isUploading ? "Đang tải lên..." : "Tạo Khung Viền"}
              </button>
            </form>
          </div>

          {/* ================= CỘT PHẢI: DANH SÁCH KHUNG ================= */}
          <div className="col-span-2 rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="mb-6 text-xl font-bold text-gray-800">Danh Sách Khung Đang Có</h2>
            
            {isLoading ? (
              <p className="text-gray-500 font-bold">Đang tải dữ liệu...</p>
            ) : frames.length === 0 ? (
              <p className="text-gray-500">Chưa có khung viền nào trong hệ thống.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {frames.map((frame) => (
                  <div key={frame.id} className="flex flex-col items-center rounded-lg border border-gray-100 bg-gray-50 p-4 transition-transform hover:-translate-y-1 hover:shadow-md">
                    <div className="relative mb-4 flex h-24 w-24 items-center justify-center">
                      {/* Avatar giả để xem khung */}
                      <div className="h-16 w-16 overflow-hidden rounded-full bg-gray-300">
                        <img src="https://i.pravatar.cc/150?img=3" alt="demo-avatar" className="h-full w-full object-cover" />
                      </div>
                      
                     {/* Bọc điều kiện bằng Toán tử 3 ngôi CỰC KỲ CHẶT CHẼ */}
                        {typeof frame.image_url === 'string' && frame.image_url.trim().length > 0 ? (
                        <div className="absolute -inset-2 z-10 pointer-events-none">
                            <Image 
                            src={frame.image_url} 
                            alt={frame.name || "Khung viền"} 
                            fill 
                            sizes="100px" 
                            className="object-contain" 
                            />
                        </div>
                        ) : null}
                    </div>
                    <span className="text-center text-sm font-bold text-gray-800">{frame.name}</span>
                    <span className="text-xs text-gray-500">ID: {frame.id}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}