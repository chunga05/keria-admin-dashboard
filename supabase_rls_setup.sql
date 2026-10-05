-- ============================================================
-- KERIA ADMIN DASHBOARD - SUPABASE RLS SETUP
-- Chạy script này trong Supabase SQL Editor (project mới)
-- ============================================================

-- ─── 1. TẠO HÀM is_admin() ──────────────────────────────────
-- Kiểm tra user hiện tại có role = 'admin' trong bảng users không
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

-- ─── 2. TẠO HÀM RPC get_admin_stats() ──────────────────────
-- Dashboard cần hàm này để hiển thị thống kê
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT json_build_object(
    'approvedUsers', (SELECT count(*) FROM public.users WHERE status = 'approved'),
    'pendingUsers',  (SELECT count(*) FROM public.users WHERE status = 'pending'),
    'totalPosts',    (SELECT count(*) FROM public.posts),
    'totalWishes',   (SELECT count(*) FROM public.fan_wishes),
    'hiddenWishes',  (SELECT count(*) FROM public.fan_wishes WHERE is_hidden = true)
  );
$$;

-- ─── 3. BẬT RLS CHO TẤT CẢ CÁC BẢNG ───────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatar_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stamp_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passport_stamps ENABLE ROW LEVEL SECURITY;

-- ─── 4. XÓA POLICIES CŨ (nếu có) để tránh trùng ────────────
-- users
DROP POLICY IF EXISTS "admin_select_users" ON public.users;
DROP POLICY IF EXISTS "admin_update_users" ON public.users;
DROP POLICY IF EXISTS "admin_insert_users" ON public.users;
DROP POLICY IF EXISTS "user_select_own" ON public.users;
DROP POLICY IF EXISTS "user_update_own" ON public.users;
DROP POLICY IF EXISTS "service_insert_users" ON public.users;

-- posts
DROP POLICY IF EXISTS "admin_all_posts" ON public.posts;
DROP POLICY IF EXISTS "anyone_select_posts" ON public.posts;

-- content
DROP POLICY IF EXISTS "admin_all_content" ON public.content;
DROP POLICY IF EXISTS "anyone_select_content" ON public.content;

-- projects
DROP POLICY IF EXISTS "admin_all_projects" ON public.projects;
DROP POLICY IF EXISTS "anyone_select_projects" ON public.projects;

-- project_stages
DROP POLICY IF EXISTS "admin_all_project_stages" ON public.project_stages;
DROP POLICY IF EXISTS "anyone_select_project_stages" ON public.project_stages;

-- facebook_links
DROP POLICY IF EXISTS "admin_all_facebook_links" ON public.facebook_links;
DROP POLICY IF EXISTS "anyone_select_facebook_links" ON public.facebook_links;

-- fan_wishes
DROP POLICY IF EXISTS "admin_all_fan_wishes" ON public.fan_wishes;
DROP POLICY IF EXISTS "anyone_select_fan_wishes" ON public.fan_wishes;
DROP POLICY IF EXISTS "user_insert_wish" ON public.fan_wishes;

-- banned_words
DROP POLICY IF EXISTS "admin_all_banned_words" ON public.banned_words;
DROP POLICY IF EXISTS "anyone_select_banned_words" ON public.banned_words;

-- avatar_frames
DROP POLICY IF EXISTS "admin_all_avatar_frames" ON public.avatar_frames;
DROP POLICY IF EXISTS "anyone_select_avatar_frames" ON public.avatar_frames;

-- stamp_requests
DROP POLICY IF EXISTS "admin_all_stamp_requests" ON public.stamp_requests;
DROP POLICY IF EXISTS "user_insert_stamp_request" ON public.stamp_requests;
DROP POLICY IF EXISTS "user_select_own_stamp_requests" ON public.stamp_requests;

-- passports
DROP POLICY IF EXISTS "admin_all_passports" ON public.passports;
DROP POLICY IF EXISTS "user_select_own_passport" ON public.passports;

-- passport_stamps
DROP POLICY IF EXISTS "admin_all_passport_stamps" ON public.passport_stamps;
DROP POLICY IF EXISTS "user_select_own_passport_stamps" ON public.passport_stamps;


-- ─── 5. TẠO POLICIES MỚI ────────────────────────────────────

-- ===================== USERS =====================
-- Admin có toàn quyền đọc/ghi
CREATE POLICY "admin_select_users" ON public.users
  FOR SELECT USING (is_admin());

CREATE POLICY "admin_update_users" ON public.users
  FOR UPDATE USING (is_admin());

-- User thường đọc hồ sơ của chính mình
CREATE POLICY "user_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- User thường cập nhật hồ sơ của chính mình
CREATE POLICY "user_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Cho phép insert (trigger tạo user mới khi đăng ký)
CREATE POLICY "service_insert_users" ON public.users
  FOR INSERT WITH CHECK (true);

-- ===================== POSTS =====================
CREATE POLICY "admin_all_posts" ON public.posts
  FOR ALL USING (is_admin());

CREATE POLICY "anyone_select_posts" ON public.posts
  FOR SELECT USING (true);

-- ===================== CONTENT =====================
CREATE POLICY "admin_all_content" ON public.content
  FOR ALL USING (is_admin());

CREATE POLICY "anyone_select_content" ON public.content
  FOR SELECT USING (true);

-- ===================== PROJECTS =====================
CREATE POLICY "admin_all_projects" ON public.projects
  FOR ALL USING (is_admin());

CREATE POLICY "anyone_select_projects" ON public.projects
  FOR SELECT USING (true);

-- ===================== PROJECT_STAGES =====================
CREATE POLICY "admin_all_project_stages" ON public.project_stages
  FOR ALL USING (is_admin());

CREATE POLICY "anyone_select_project_stages" ON public.project_stages
  FOR SELECT USING (true);

-- ===================== FACEBOOK_LINKS =====================
CREATE POLICY "admin_all_facebook_links" ON public.facebook_links
  FOR ALL USING (is_admin());

CREATE POLICY "anyone_select_facebook_links" ON public.facebook_links
  FOR SELECT USING (true);

-- ===================== FAN_WISHES =====================
CREATE POLICY "admin_all_fan_wishes" ON public.fan_wishes
  FOR ALL USING (is_admin());

CREATE POLICY "anyone_select_fan_wishes" ON public.fan_wishes
  FOR SELECT USING (true);

-- Ai đăng nhập cũng gửi được lời chúc
CREATE POLICY "user_insert_wish" ON public.fan_wishes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ===================== BANNED_WORDS =====================
CREATE POLICY "admin_all_banned_words" ON public.banned_words
  FOR ALL USING (is_admin());

CREATE POLICY "anyone_select_banned_words" ON public.banned_words
  FOR SELECT USING (true);

-- ===================== AVATAR_FRAMES =====================
CREATE POLICY "admin_all_avatar_frames" ON public.avatar_frames
  FOR ALL USING (is_admin());

CREATE POLICY "anyone_select_avatar_frames" ON public.avatar_frames
  FOR SELECT USING (true);

-- ===================== STAMP_REQUESTS =====================
CREATE POLICY "admin_all_stamp_requests" ON public.stamp_requests
  FOR ALL USING (is_admin());

-- User gửi yêu cầu nhận dấu
CREATE POLICY "user_insert_stamp_request" ON public.stamp_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User xem yêu cầu của chính mình
CREATE POLICY "user_select_own_stamp_requests" ON public.stamp_requests
  FOR SELECT USING (auth.uid() = user_id);

-- ===================== PASSPORTS =====================
CREATE POLICY "admin_all_passports" ON public.passports
  FOR ALL USING (is_admin());

CREATE POLICY "user_select_own_passport" ON public.passports
  FOR SELECT USING (auth.uid() = user_id);

-- ===================== PASSPORT_STAMPS =====================
CREATE POLICY "admin_all_passport_stamps" ON public.passport_stamps
  FOR ALL USING (is_admin());

CREATE POLICY "user_select_own_passport_stamps" ON public.passport_stamps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.passports
      WHERE passports.id = passport_stamps.passport_id
        AND passports.user_id = auth.uid()
    )
  );


-- ─── 6. GRANT QUYỀN THỰC THI CHO RPC ────────────────────────
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO anon;


-- ============================================================
-- HOÀN TẤT! Tất cả bảng đã được cấu hình RLS.
-- Admin (role = 'admin' trong bảng users) có toàn quyền.
-- User thường chỉ đọc được dữ liệu public và dữ liệu của mình.
-- ============================================================
