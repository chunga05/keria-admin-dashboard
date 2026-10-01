"use client";

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Khởi tạo Supabase client (Thay bằng file config chung của bạn nếu có)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AdminFacebookForm() {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', content: '' });

    // Validate cơ bản
    if (!url.includes('facebook.com')) {
      setMessage({ type: 'error', content: 'Vui lòng nhập đúng đường dẫn Facebook!' });
      setLoading(false);
      return;
    }

    // Insert dữ liệu vào Supabase
    const { data, error } = await supabase
      .from('facebook_links')
      .insert([
        { title: title, url: url }
      ]);

    if (error) {
      setMessage({ type: 'error', content: `Lỗi: ${error.message}` });
    } else {
      setMessage({ type: 'success', content: 'Thêm link Facebook thành công!' });
      setTitle(''); // Reset form
      setUrl('');
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Thêm Link Facebook (Admin)</h2>
      
      {message.content && (
        <div className={`p-4 mb-4 rounded-md ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          {message.content}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề (Tùy chọn)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Bài viết khai trương"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Đường dẫn Facebook (Bắt buộc)</label>
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.facebook.com/..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2.5 rounded-lg text-white font-semibold transition-colors
            ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
          `}
        >
          {loading ? 'Đang lưu...' : 'Lưu Link'}
        </button>
      </form>
    </div>
  );
}