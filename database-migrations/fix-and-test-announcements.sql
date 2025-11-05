-- ================================================================
-- 系统公告完整修复和测试脚本
-- ================================================================
-- 一键解决所有问题：RLS 策略 + 测试数据 + 验证
-- ================================================================

-- ============================================================
-- 第一步：修复 RLS 策略
-- ============================================================
RAISE NOTICE '🔧 步骤 1: 修复 RLS 策略...';

-- 删除旧策略
DROP POLICY IF EXISTS "Anyone can view active announcements" ON public.system_announcements;
DROP POLICY IF EXISTS "Admins can view all announcements" ON public.system_announcements;
DROP POLICY IF EXISTS "Public can view active announcements" ON public.system_announcements;

-- 创建新策略：允许所有人（包括未认证用户）查看激活的公告
CREATE POLICY "Public can view active announcements"
  ON public.system_announcements
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- 创建新策略：管理员可以查看所有公告
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

RAISE NOTICE '✅ RLS 策略已更新';

-- ============================================================
-- 第二步：确保有激活的测试公告
-- ============================================================
RAISE NOTICE '🔧 步骤 2: 创建测试公告...';

-- 先将所有现有公告设为未激活
UPDATE public.system_announcements
SET is_active = false
WHERE is_active = true;

-- 插入或更新一条激活的测试公告
INSERT INTO public.system_announcements (content, is_active, published_at)
VALUES 
  ('🎉 欢迎使用 AI 婚纱照平台！现在注册即送 50 免费积分，快来体验吧！', true, now())
ON CONFLICT (id) DO NOTHING;

-- 如果插入失败（因为已存在），则更新最新的一条
DO $$
DECLARE
  latest_id UUID;
BEGIN
  -- 获取最新的公告 ID
  SELECT id INTO latest_id
  FROM public.system_announcements
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- 如果存在公告，激活它
  IF latest_id IS NOT NULL THEN
    UPDATE public.system_announcements
    SET 
      is_active = true,
      content = '🎉 欢迎使用 AI 婚纱照平台！现在注册即送 50 免费积分，快来体验吧！',
      published_at = now()
    WHERE id = latest_id;
    
    RAISE NOTICE '✅ 已激活公告: %', latest_id;
  ELSE
    RAISE NOTICE '⚠️  数据库中没有公告，请检查 INSERT 是否成功';
  END IF;
END $$;

-- ============================================================
-- 第三步：验证配置
-- ============================================================
RAISE NOTICE '';
RAISE NOTICE '🔍 步骤 3: 验证配置...';
RAISE NOTICE '';

-- 显示当前激活的公告
DO $$
DECLARE
  announcement_record RECORD;
  active_count INTEGER;
BEGIN
  -- 统计激活的公告数量
  SELECT COUNT(*) INTO active_count
  FROM public.system_announcements
  WHERE is_active = true;
  
  RAISE NOTICE '📊 激活的公告数量: %', active_count;
  RAISE NOTICE '';
  
  IF active_count > 0 THEN
    -- 显示激活的公告详情
    FOR announcement_record IN 
      SELECT id, content, is_active, published_at
      FROM public.system_announcements
      WHERE is_active = true
      ORDER BY published_at DESC
    LOOP
      RAISE NOTICE '✅ 激活的公告:';
      RAISE NOTICE '   ID: %', announcement_record.id;
      RAISE NOTICE '   内容: %', LEFT(announcement_record.content, 50) || '...';
      RAISE NOTICE '   发布时间: %', announcement_record.published_at;
      RAISE NOTICE '';
    END LOOP;
  ELSE
    RAISE NOTICE '❌ 没有激活的公告！';
  END IF;
END $$;

-- 显示 RLS 策略
RAISE NOTICE '🔒 RLS 策略配置:';
SELECT
  '   ' || policyname as "策略名称",
  roles::text as "允许角色",
  cmd::text as "操作"
FROM pg_policies
WHERE tablename = 'system_announcements'
ORDER BY policyname;

-- ============================================================
-- 第四步：测试访问权限
-- ============================================================
RAISE NOTICE '';
RAISE NOTICE '🧪 步骤 4: 测试访问权限...';

-- 测试 anon 角色
DO $$
DECLARE
  anon_count INTEGER;
BEGIN
  SET LOCAL ROLE anon;
  SELECT COUNT(*) INTO anon_count
  FROM public.system_announcements
  WHERE is_active = true;
  RESET ROLE;
  
  IF anon_count > 0 THEN
    RAISE NOTICE '✅ anon 角色可以查看 % 条激活的公告', anon_count;
  ELSE
    RAISE NOTICE '❌ anon 角色无法查看激活的公告';
  END IF;
END $$;

-- 测试 authenticated 角色
DO $$
DECLARE
  auth_count INTEGER;
BEGIN
  SET LOCAL ROLE authenticated;
  SELECT COUNT(*) INTO auth_count
  FROM public.system_announcements
  WHERE is_active = true;
  RESET ROLE;
  
  IF auth_count > 0 THEN
    RAISE NOTICE '✅ authenticated 角色可以查看 % 条激活的公告', auth_count;
  ELSE
    RAISE NOTICE '❌ authenticated 角色无法查看激活的公告';
  END IF;
END $$;

-- ============================================================
-- 完成总结
-- ============================================================
RAISE NOTICE '';
RAISE NOTICE '========================================';
RAISE NOTICE '🎉 修复完成！';
RAISE NOTICE '========================================';
RAISE NOTICE '';
RAISE NOTICE '📝 接下来的步骤：';
RAISE NOTICE '1. 刷新前端页面';
RAISE NOTICE '2. 检查浏览器控制台是否有错误';
RAISE NOTICE '3. 访问 /api/announcements 查看是否返回数据';
RAISE NOTICE '4. 如果还是不行，请检查环境变量配置';
RAISE NOTICE '';
RAISE NOTICE '🔗 测试 URL:';
RAISE NOTICE '   公共接口: GET /api/announcements';
RAISE NOTICE '   管理接口: GET /api/admin/announcements';
RAISE NOTICE '';

