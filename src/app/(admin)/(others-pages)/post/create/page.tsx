"use client";

import { useState, useEffect } from "react";
import { getPosts, uploadMediaFile, createPost, Post } from "@/hooks/postService"; // Đảm bảo đúng đường dẫn tới PostService của bạn
import Image from "next/image";

export default function ManagePostsPage() {
  const [content, setContent] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [posts, setPosts] = useState<Post[]>([]);
  const [fetching, setFetching] = useState(true);

  // Lấy danh sách bài viết để hiển thị
  const fetchPosts = async () => {
    setFetching(true);
    const { data } = await getPosts();
    if (data) {
      setPosts(data);
    }
    setFetching(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Xử lý chọn file ảnh/video
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Xử lý submit đăng bài
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // 1. Upload ảnh qua PostService
      let imageUrls: string[] = [];
      for (const file of imageFiles) {
        const url = await uploadMediaFile(file, "images");
        imageUrls.push(url);
      }

      // 2. Upload video qua PostService (nếu có)
      let videoUrl: string | null = null;
      if (videoFile) {
        videoUrl = await uploadMediaFile(videoFile, "videos");
      }

      // 3. Tạo bài viết qua PostService
      await createPost({
        content,
        image_urls: imageUrls,
        video_url: videoUrl,
      });

      setSuccessMessage("Đăng bài viết thành công!");
      setContent("");
      setImageFiles([]);
      setVideoFile(null);

      // Tải lại danh sách ngay lập tức để hiện lên cột bên trái
      fetchPosts();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Có lỗi xảy ra khi đăng bài.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Quản Lý & Đăng Bài Viết</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* CỘT TRÁI: HIỂN THỊ BÀI ĐĂNG ĐỂ KIỂM TRA (Chiếm 7 phần) */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
            Bài Viết Đã Đăng ({posts.length})
          </h2>

          {fetching ? (
            <p className="text-sm text-gray-500">Đang tải danh sách bài viết...</p>
          ) : posts.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow-sm text-center border border-gray-100">
              <p className="text-sm text-gray-500">Chưa có bài viết nào.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
              {posts.map((post) => (
                <div key={post.id} className="bg-white p-5 rounded-xl shadow-md border border-gray-100 space-y-3">
                  <div className="text-xs text-gray-400">
                    <span>{new Date(post.created_at).toLocaleString("vi-VN")}</span>
                  </div>

                  {post.content && (
                    <p className="text-gray-800 text-sm whitespace-pre-line">{post.content}</p>
                  )}

                  {post.image_urls && post.image_urls.length > 0 && (
                    <div className={`grid gap-2 ${post.image_urls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {post.image_urls.map((url, i) => (
                        <div key={i} className="relative h-40 w-full rounded-lg overflow-hidden bg-gray-100 border">
                          <Image src={url} alt="Post image" fill className="object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  {post.video_url && (
                    <div className="mt-2">
                      <video controls className="w-full rounded-lg max-h-48 bg-black">
                        <source src={post.video_url} type="video/mp4" />
                      </video>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CỘT PHẢI: FORM ĐĂNG BÀI (Chiếm 5 phần) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl shadow-md h-fit border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Tạo Bài Viết Mới</h2>

          {errorMessage && <div className="mb-4 p-3 text-red-700 bg-red-100 rounded-lg text-sm">{errorMessage}</div>}
          {successMessage && <div className="mb-4 p-3 text-green-700 bg-green-100 rounded-lg text-sm">{successMessage}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung bài viết</label>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Bạn đang nghĩ gì thế..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              {imageFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {imageFiles.map((file, index) => (
                    <div key={index} className="relative group h-20 bg-gray-100 rounded-lg overflow-hidden border">
                      <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Video (Tùy chọn)</label>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
              />
              {videoFile && <p className="mt-1 text-xs text-gray-600">Đã chọn: <span className="font-semibold">{videoFile.name}</span></p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 text-white font-medium rounded-lg text-sm transition-colors ${
                loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Đang đăng bài..." : "Đăng Bài Viết"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}