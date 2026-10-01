// File: app/auth/receive/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  sub?: string;
  id?: string;
  email?: string;
  role?: string;
  status?: string;
  exp?: number;
}

export default function ReceiveAuthPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Sử dụng useRef để chặn React Strict Mode chạy useEffect 2 lần
  const isProcessing = useRef(false);

  useEffect(() => {
    let mounted = true;

    const setupSession = async () => {
      try {
        console.log("=================================");
        console.log("       RECEIVE ADMIN AUTH (JWT)  ");
        console.log("=================================");

        // =========================================================
        // 1. LẤY TOKEN TỪ URL HOẶC LOCAL STORAGE
        // =========================================================
        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.substring(1)
          : window.location.hash;
        
        let params = new URLSearchParams(hash);
        
        let accessToken = params.get("access_token");
        let refreshToken = params.get("refresh_token");
        
        if (!accessToken) {
          const searchParams = new URLSearchParams(window.location.search);
          accessToken = searchParams.get("access_token");
          refreshToken = searchParams.get("refresh_token");
        }

        // [MỚI] Bổ sung fallback xử lý React Strict Mode:
        // Lần 1 token bị xóa khỏi URL thì lần 2 sẽ lấy từ localStorage
        if (!accessToken) {
          accessToken = localStorage.getItem("access_token");
          refreshToken = localStorage.getItem("refresh_token");
        }

        if (!accessToken) {
          console.error("❌ Không tìm thấy access_token");
          if (mounted) {
            setErrorMsg("Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.");
            setLoading(false);
          }
          return;
        }

        // =========================================================
        // 2. GIẢI MÃ & KIỂM TRA JWT
        // =========================================================
        let decodedToken: JwtPayload;
        try {
          decodedToken = jwtDecode<JwtPayload>(accessToken);
          
          const currentTime = Math.floor(Date.now() / 1000);
          if (decodedToken.exp && decodedToken.exp < currentTime) {
            throw new Error("Token đã hết hạn");
          }
        } catch (err) {
          console.error("❌ Lỗi giải mã JWT:", err);
          if (mounted) {
            setErrorMsg("Token không hợp lệ hoặc đã hết hạn.");
            setLoading(false);
          }
          return;
        }

        const userId = decodedToken.sub || decodedToken.id;
        console.log("✅ DECODED JWT USER ID:", userId);

        // =========================================================
        // 3. LƯU TRỮ TOKEN
        // =========================================================
        localStorage.setItem("access_token", accessToken);
        if (refreshToken) {
          localStorage.setItem("refresh_token", refreshToken);
        }

        // Chỉ gọi history.replaceState nếu trên URL thực sự có token
        if (window.location.hash.includes("access_token") || window.location.search.includes("access_token")) {
          window.history.replaceState(null, "", window.location.pathname);
          console.log("✅ Đã xóa token khỏi URL");
        }

        // =========================================================
        // 4. KIỂM TRA QUYỀN ADMIN (ROLE & STATUS)
        // =========================================================
        let role = "";
        let status = "";

        if (decodedToken.role && decodedToken.status) {
          role = String(decodedToken.role).trim().toLowerCase();
          status = String(decodedToken.status).trim().toLowerCase();
        } else {
          console.log("⏳ Đang truy vấn bảng users để lấy quyền...");
          
          const { data: userRecord, error: userError } = await supabase
            .from("users")
            .select("id, role, status")
            .eq("id", userId)
            .maybeSingle();

          if (userError || !userRecord) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            if (mounted) {
              setErrorMsg("Không thể xác minh quyền quản trị của tài khoản này.");
              setLoading(false);
            }
            return;
          }
          
          role = String(userRecord.role || "").trim().toLowerCase();
          status = String(userRecord.status || "").trim().toLowerCase();
        }

        // =========================================================
        // 5. XỬ LÝ KẾT QUẢ
        // =========================================================
        const isAdmin = role === "admin";
        const isApproved = status === "approved";

        if (!isAdmin || !isApproved) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");

          if (mounted) {
            if (status === "pending") {
              setErrorMsg("Tài khoản đang chờ duyệt.");
            } else if (!isAdmin) {
              setErrorMsg("Tài khoản này không có quyền quản trị.");
            } else {
              setErrorMsg("Tài khoản chưa được phê duyệt.");
            }
            setLoading(false);
          }
          return;
        }

        // =========================================================
        // 6. THÀNH CÔNG -> CHUYỂN HƯỚNG
        // =========================================================
        console.log("✅ ADMIN LOGIN SUCCESS. REDIRECT → /");
        
        if (mounted) {
          // Bắt buộc phải tắt loading tại đây để UI không bị kẹt
          setLoading(false);
          router.replace("/");
        }

      } catch (error) {
        console.error("❌ RECEIVE AUTH EXCEPTION:", error);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        if (mounted) {
          setErrorMsg("Đã xảy ra lỗi trong quá trình đăng nhập.");
          setLoading(false);
        }
      }
    };

    setupSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  // =========================================================
  // UI
  // =========================================================
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4">
      {loading ? (
        <>
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-pink-500" />
          <p className="text-sm text-gray-500">Đang kiểm tra chứng chỉ JWT...</p>
        </>
      ) : errorMsg ? (
        <>
          <div className="max-w-md text-center">
            <p className="mb-2 text-lg font-semibold text-red-500">
              Không thể truy cập
            </p>
            <p className="text-sm leading-6 text-gray-500">{errorMsg}</p>
          </div>
          <a
            href="/"
            className="rounded-lg bg-pink-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-pink-600"
          >
            Về trang đăng nhập
          </a>
        </>
      ) : null}
    </div>
  );
}