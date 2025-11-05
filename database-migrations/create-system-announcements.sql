-- ================================================================
-- 系统公告表 (System Announcements)
-- ================================================================
-- 用于在首页顶部显示系统公告通知条
-- 支持管理员在后台管理公告内容、开关状态和发布日期
-- ================================================================

-- 创建系统公告表
CREATE TABLE IF NOT EXISTS public.system_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  is_active boolean DEFAULT false,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建更新时间触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为系统公告表添加更新时间触发器
DROP TRIGGER IF EXISTS update_system_announcements_updated_at ON public.system_announcements;
CREATE TRIGGER update_system_announcements_updated_at
  BEFORE UPDATE ON public.system_announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全 (RLS)
ALTER TABLE public.system_announcements ENABLE ROW LEVEL SECURITY;

-- RLS 策略 1: 所有人（包括未认证用户）可以查看激活的公告
-- 注意：必须明确指定 TO anon, authenticated 以允许匿名访问
CREATE POLICY "Public can view active announcements"
  ON public.system_announcements
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- RLS 策略 2: 管理员可以查看所有公告
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

-- RLS 策略 3: 管理员可以创建公告
CREATE POLICY "Admins can insert announcements"
  ON public.system_announcements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- RLS 策略 4: 管理员可以更新公告
CREATE POLICY "Admins can update announcements"
  ON public.system_announcements
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- RLS 策略 5: 管理员可以删除公告
CREATE POLICY "Admins can delete announcements"
  ON public.system_announcements
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_system_announcements_active 
  ON public.system_announcements(is_active, published_at DESC);

-- 插入示例公告（可选）
INSERT INTO public.system_announcements (content, is_active, published_at)
VALUES 
  ('欢迎使用 AI 婚纱照平台！现在注册即送 50 免费积分，快来体验吧！', false, now())
ON CONFLICT DO NOTHING;

-- 完成提示
COMMENT ON TABLE public.system_announcements IS '系统公告表：用于在首页顶部显示通知条';
COMMENT ON COLUMN public.system_announcements.content IS '公告内容（纯文本）';
COMMENT ON COLUMN public.system_announcements.is_active IS '是否显示公告';
COMMENT ON COLUMN public.system_announcements.published_at IS '发布日期';

