
// File: app/auth/receive/page.tsx
// Repo ADMIN

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ReceiveAuthPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const setupSession = async () => {
      try {
        console.log("=================================");
        console.log("       RECEIVE ADMIN AUTH");
        console.log("=================================");

        // =========================================================
        // 1. KIỂM TRA URL
        // =========================================================

        console.log("PATH:", window.location.pathname);
        console.log("FULL URL:", window.location.href);
        console.log("HASH EXISTS:", !!window.location.hash);

        // Token Supabase nằm trong hash:
        //
        // /auth/receive#access_token=xxx&refresh_token=xxx
        //
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
        console.log(
          "ACCESS TOKEN:",
          accessToken ? "FOUND" : "NOT FOUND"
        );

        console.log(
          "REFRESH TOKEN:",
          refreshToken ? "FOUND" : "NOT FOUND"
        );

        // =========================================================
        // 2. KIỂM TRA TOKEN
        // =========================================================

        if (!accessToken || !refreshToken) {
          console.error(
            "❌ Không tìm thấy access_token hoặc refresh_token"
          );

          if (mounted) {
            setErrorMsg(
              "Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại."
            );
            setLoading(false);
          }

          return;
        }

        // =========================================================
        // 3. TẠO SESSION ADMIN
        // =========================================================

        console.log("⏳ Đang tạo Supabase session...");

        const {
          data: sessionData,
          error: sessionError,
        } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        console.log("SET SESSION RESULT:", {
          hasSession: !!sessionData.session,
          error: sessionError?.message || null,
        });

        if (sessionError) {
          console.error(
            "❌ SET SESSION ERROR:",
            sessionError.message
          );

          await supabase.auth.signOut();

          if (mounted) {
            setErrorMsg(
              `Không thể tạo phiên đăng nhập: ${sessionError.message}`
            );
            setLoading(false);
          }

          return;
        }

        const session = sessionData.session;

        if (!session) {
          console.error(
            "❌ setSession không trả về session"
          );

          if (mounted) {
            setErrorMsg(
              "Không thể thiết lập phiên đăng nhập."
            );
            setLoading(false);
          }

          return;
        }

        console.log("✅ SESSION ĐÃ ĐƯỢC TẠO");
        console.log("SESSION USER ID:", session.user.id);
        console.log("SESSION EMAIL:", session.user.email);

        // =========================================================
        // 4. XÓA TOKEN KHỎI URL
        // =========================================================
        //
        // Chỉ xóa sau khi setSession thành công.
        //

        window.history.replaceState(
          null,
          "",
          window.location.pathname
        );

        console.log(
          "✅ Đã xóa access_token / refresh_token khỏi URL"
        );

        // =========================================================
        // 5. LẤY USER HIỆN TẠI
        // =========================================================

        console.log("⏳ Đang kiểm tra Supabase Auth user...");

        const {
          data: authUserData,
          error: authUserError,
        } = await supabase.auth.getUser();

        console.log("GET USER RESULT:", {
          userId: authUserData.user?.id || null,
          email: authUserData.user?.email || null,
          error: authUserError?.message || null,
        });

        if (authUserError || !authUserData.user) {
          console.error(
            "❌ Không lấy được user:",
            authUserError?.message
          );

          await supabase.auth.signOut();

          if (mounted) {
            setErrorMsg(
              "Không thể xác định tài khoản đăng nhập."
            );
            setLoading(false);
          }

          return;
        }

        const authUser = authUserData.user;

        console.log("=================================");
        console.log("AUTH USER");
        console.log("ID:", authUser.id);
        console.log("=================================");

        // =========================================================
        // 6. KIỂM TRA BẢNG users
        // =========================================================

        console.log(
          "⏳ Đang kiểm tra quyền trong bảng users..."
        );

        const {
          data: userRecord,
          error: userError,
        } = await supabase
          .from("users")
          .select("id, role, status")
          .eq("id", authUser.id)
          .maybeSingle();

        console.log("USERS TABLE RESULT:", {
          userRecord,
          error: userError?.message || null,
          errorCode: userError?.code || null,
          errorDetails: userError?.details || null,
          errorHint: userError?.hint || null,
        });

        // =========================================================
        // 7. LỖI QUERY users
        // =========================================================

        if (userError) {
          console.error(
            "❌ LỖI QUERY BẢNG users"
          );

          console.error("CODE:", userError.code);
          console.error("MESSAGE:", userError.message);
          console.error("DETAILS:", userError.details);
          console.error("HINT:", userError.hint);

          await supabase.auth.signOut();

          if (mounted) {
            setErrorMsg(
              `Không thể kiểm tra quyền tài khoản: ${userError.message}`
            );
            setLoading(false);
          }

          return;
        }

        // =========================================================
        // 8. KHÔNG TÌM THẤY USER
        // =========================================================

        if (!userRecord) {
          console.error(
            "❌ Không tìm thấy user trong bảng users"
          );

          console.error(
            "Auth user ID:",
            authUser.id
          );

          console.error(
            "Auth user email:",
            authUser.email
          );

          await supabase.auth.signOut();

          if (mounted) {
            setErrorMsg(
              "Tài khoản đăng nhập chưa tồn tại trong hệ thống quản trị."
            );
            setLoading(false);
          }

          return;
        }

        // =========================================================
        // 9. CHUẨN HÓA ROLE + STATUS
        // =========================================================

        const role = String(userRecord.role || "")
          .trim()
          .toLowerCase();

        const status = String(userRecord.status || "")
          .trim()
          .toLowerCase();

        console.log("=================================");
        console.log("ADMIN USER RECORD");
        console.log("ID:", userRecord.id);
        
        console.log("ROLE:", role);
        console.log("STATUS:", status);
        console.log("=================================");

        // =========================================================
        // 10. KIỂM TRA ADMIN
        // =========================================================

        const isAdmin = role === "admin";
        const isApproved = status === "approved";

        console.log("IS ADMIN:", isAdmin);
        console.log("IS APPROVED:", isApproved);

        // =========================================================
        // 11. KHÔNG PHẢI ADMIN HOẶC CHƯA APPROVED
        // =========================================================

        if (!isAdmin || !isApproved) {
          console.warn(
            "❌ TỪ CHỐI TRUY CẬP ADMIN"
          );

          console.warn({
            
            role,
            status,
          });

          await supabase.auth.signOut();

          if (mounted) {
            if (status === "pending") {
              setErrorMsg(
                "Tài khoản đang chờ duyệt. Bạn chưa được phép truy cập trang quản trị."
              );
            } else if (!isAdmin) {
              setErrorMsg(
                "Tài khoản này không có quyền quản trị."
              );
            } else {
              setErrorMsg(
                "Tài khoản chưa được phê duyệt để truy cập trang quản trị."
              );
            }

            setLoading(false);
          }

          return;
        }

        // =========================================================
        // 12. ADMIN HỢP LỆ
        // =========================================================

        console.log("=================================");
        console.log("✅ ADMIN LOGIN SUCCESS");
        
        console.log("ROLE:", role);
        console.log("STATUS:", status);
        console.log("REDIRECT → /");
        console.log("=================================");

        if (mounted) {
          setLoading(false);

          // Đợi một chút để Supabase lưu session
          // trước khi chuyển trang.
          await new Promise((resolve) =>
            setTimeout(resolve, 100)
          );

          router.replace("/");
        }
      } catch (error) {
        console.error(
          "❌ RECEIVE AUTH EXCEPTION:",
          error
        );

        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.error(
            "Sign out error:",
            signOutError
          );
        }

        if (mounted) {
          setErrorMsg(
            "Đã xảy ra lỗi trong quá trình đăng nhập."
          );
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

          <p className="text-sm text-gray-500">
            Đang kiểm tra quyền quản trị...
          </p>
        </>
      ) : errorMsg ? (
        <>
          <div className="max-w-md text-center">
            <p className="mb-2 text-lg font-semibold text-red-500">
              Không thể truy cập
            </p>

            <p className="text-sm leading-6 text-gray-500">
              {errorMsg}
            </p>
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

