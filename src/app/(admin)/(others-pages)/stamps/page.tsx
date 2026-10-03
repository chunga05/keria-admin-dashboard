// app/admin/stamps/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Check, X, Eye, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { TableFilter } from '@/components/ui/table/TableFilter';

interface AdminStampRequest {
  id: number;
  user_id: string;
  stage_id: number;
  evidence_image_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  users?: { display_name: string; email: string };
  project_stages?: { stage_name: string };
}

export default function AdminStampRequestsPage() {
  const [requests, setRequests] = useState<AdminStampRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [filters, setFilters] = useState<{ search?: string; startDate?: string; endDate?: string }>({});

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('stamp_requests')
        .select(`
          id, 
          user_id, 
          stage_id, 
          evidence_image_url, 
          status, 
          created_at,
          users (
            display_name,
            email
          ),
          project_stages (
            stage_name
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate + 'T23:59:59');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Lỗi fetch admin stamp requests:', error.message);
      } else if (data) {
        setRequests(data as any);
      }
    } catch (err: any) {
      console.error('Lỗi khi lấy danh sách yêu cầu:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, [filters]);

  const handleAction = async (id: number, action: 'approved' | 'rejected') => {
    setProcessingId(id);
    try {
      // ĐƯỜNG DẪN CHUẨN: Bắt đầu bằng /api/ (bỏ tiền tố app/)
      const res = await fetch(`/api/stamp-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const responseText = await res.text();
      let result: any = {};
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(`Đường dẫn API trả về HTML (Mã HTTP: ${res.status}). Kiểm tra lại route backend!`);
      }

      if (!res.ok) throw new Error(result.error || 'Xử lý thất bại');

      // Cập nhật lại UI: Xóa request đã duyệt khỏi danh sách chờ
      setRequests((prev) => prev.filter((item) => item.id !== id));
      if (previewImage) setPreviewImage(null);
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Làm sạch URL ảnh (phòng trường hợp DB lưu bị dính 2 dấu // sau domain)
  const sanitizeImageUrl = (url: string | null) => {
    if (!url) return '';
    return url.replace(/([^:]\/)\/+/g, '$1');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Duyệt Yêu Cầu Nhận Con Dấu</h1>

      <TableFilter onFilterChange={setFilters} placeholder="Tìm kiếm bị vô hiệu hóa, vui lòng lọc theo ngày" />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : requests.length === 0 ? (
        <p className="text-gray-500 text-center py-10 bg-white rounded-lg border">
          Không có yêu cầu nào đang chờ duyệt.
        </p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">User</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Chặng</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Thời gian gửi</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Ảnh minh chứng</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/70">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {item.users?.display_name || 'Khách'}
                    </p>
                    <p className="text-xs text-gray-500">{item.users?.email}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-blue-600">
                    {item.project_stages?.stage_name || `#${item.stage_id}`}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(item.created_at).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.evidence_image_url ? (
                      <button
                        onClick={() => setPreviewImage(sanitizeImageUrl(item.evidence_image_url))}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Xem ảnh
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">Đã xóa</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      disabled={processingId === item.id}
                      onClick={() => handleAction(item.id, 'approved')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Duyệt
                    </button>
                    <button
                      disabled={processingId === item.id}
                      onClick={() => handleAction(item.id, 'rejected')}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Từ chối
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal phóng to ảnh minh chứng */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] bg-white rounded-lg p-3 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white rounded-full p-1.5 z-10 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Minh chứng nộp dấu"
              className="max-h-[75vh] w-auto max-w-full object-contain rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
}