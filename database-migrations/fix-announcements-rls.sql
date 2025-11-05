-- ================================================================
-- 修复系统公告的 RLS 策略
-- ================================================================
-- 问题：原策略只允许认证用户访问，但前端 API 使用 anon key 访问
-- 解决：删除原策略，创建新策略明确允许 anon 和 authenticated 角色
-- ================================================================

-- 1. 删除旧的查看策略
DROP POLICY IF EXISTS "Anyone can view active announcements" ON public.system_announcements;
DROP POLICY IF EXISTS "Admins can view all announcements" ON public.system_announcements;

-- 2. 创建新的策略：允许所有人（包括未认证用户）查看激活的公告
CREATE POLICY "Public can view active announcements"
  ON public.system_announcements
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- 3. 创建新的策略：管理员可以查看所有公告
CREATE POLICY "Admins can view all announcements"
  ON public.system_announcements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 4. 验证策略
-- 查看当前表的所有策略
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles::text,
  cmd,
  qual as condition
FROM pg_policies
WHERE tablename = 'system_announcements'
ORDER BY policyname;

-- 完成提示
DO $$
BEGIN
  RAISE NOTICE '✅ 系统公告 RLS 策略已修复';
  RAISE NOTICE '✅ 现在 anon 和 authenticated 角色都可以查看激活的公告';
  RAISE NOTICE '✅ 管理员仍然可以查看所有公告';
END $$;

