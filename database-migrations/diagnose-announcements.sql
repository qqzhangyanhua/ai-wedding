-- ================================================================
-- 诊断系统公告问题
-- ================================================================
-- 如果 /api/announcements 返回 null，按以下步骤诊断
-- ================================================================

-- 步骤 1: 检查表中是否有数据
SELECT 
  id,
  content,
  is_active,
  published_at,
  created_at
FROM public.system_announcements
ORDER BY created_at DESC;

-- 步骤 2: 检查是否有激活的公告
SELECT 
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE is_active = true) as active_count,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_count
FROM public.system_announcements;

-- 步骤 3: 检查 RLS 策略配置
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles::text as allowed_roles,
  cmd,
  qual as condition
FROM pg_policies
WHERE tablename = 'system_announcements'
ORDER BY policyname;

-- 步骤 4: 测试 anon 角色能否访问数据
-- 切换到 anon 角色测试
SET ROLE anon;
SELECT COUNT(*) as visible_to_anon 
FROM public.system_announcements 
WHERE is_active = true;
RESET ROLE;

-- 步骤 5: 测试 authenticated 角色能否访问数据
SET ROLE authenticated;
SELECT COUNT(*) as visible_to_authenticated 
FROM public.system_announcements 
WHERE is_active = true;
RESET ROLE;

-- 步骤 6: 检查表的 RLS 是否启用
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'system_announcements';

-- ================================================================
-- 如果上述检查显示没有激活的公告，创建一条测试公告
-- ================================================================

-- 清空现有数据（可选，谨慎使用）
-- TRUNCATE TABLE public.system_announcements;

-- 插入一条激活的测试公告
INSERT INTO public.system_announcements (content, is_active, published_at)
VALUES 
  ('🎉 欢迎使用 AI 婚纱照平台！现在注册即送 50 免费积分，快来体验吧！', true, now())
ON CONFLICT DO NOTHING
RETURNING *;

-- 再次验证
SELECT 
  id,
  content,
  is_active,
  published_at
FROM public.system_announcements
WHERE is_active = true
ORDER BY published_at DESC
LIMIT 1;

-- ================================================================
-- 输出诊断总结
-- ================================================================
DO $$
DECLARE
  total_count INTEGER;
  active_count INTEGER;
  rls_enabled BOOLEAN;
  anon_visible INTEGER;
BEGIN
  -- 统计数据
  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_active = true)
  INTO total_count, active_count
  FROM public.system_announcements;
  
  -- 检查 RLS
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables
  WHERE tablename = 'system_announcements';
  
  -- 输出诊断信息
  RAISE NOTICE '========================================';
  RAISE NOTICE '系统公告诊断报告';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 数据统计:';
  RAISE NOTICE '   - 总公告数: %', total_count;
  RAISE NOTICE '   - 激活的公告: %', active_count;
  RAISE NOTICE '   - RLS 启用状态: %', rls_enabled;
  RAISE NOTICE '';
  
  IF active_count = 0 THEN
    RAISE NOTICE '❌ 问题：没有激活的公告！';
    RAISE NOTICE '💡 解决方案：请执行上面的 INSERT 语句创建测试公告';
  ELSE
    RAISE NOTICE '✅ 有 % 条激活的公告', active_count;
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

