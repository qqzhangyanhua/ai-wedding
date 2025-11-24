-- 创建模型配置表
CREATE TABLE IF NOT EXISTS public.model_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('generate-image', 'identify-image', 'other')),
  name TEXT NOT NULL,
  api_base_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  model_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_model_configs_type_status ON public.model_configs(type, status);
CREATE INDEX IF NOT EXISTS idx_model_configs_created_by ON public.model_configs(created_by);

-- 添加注释
COMMENT ON TABLE public.model_configs IS '模型配置表，用于管理各类 AI 模型的 API 配置';
COMMENT ON COLUMN public.model_configs.type IS '配置类型：generate-image 等';
COMMENT ON COLUMN public.model_configs.status IS '状态：active（激活）或 inactive（停用）';
COMMENT ON COLUMN public.model_configs.api_key IS 'API 密钥（敏感信息）';

-- 创建 updated_at 自动更新触发器
CREATE OR REPLACE FUNCTION update_model_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_model_configs_updated_at
  BEFORE UPDATE ON public.model_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_model_configs_updated_at();

-- 创建触发器：激活配置时自动停用同类型其他配置
CREATE OR REPLACE FUNCTION ensure_single_active_config()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果新记录或更新后的记录状态为 active
  IF NEW.status = 'active' THEN
    -- 将同类型的其他 active 配置设为 inactive
    UPDATE public.model_configs
    SET status = 'inactive'
    WHERE type = NEW.type
      AND id != NEW.id
      AND status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_active_config
  BEFORE INSERT OR UPDATE OF status ON public.model_configs
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_config();

-- RLS 策略：启用行级安全
ALTER TABLE public.model_configs ENABLE ROW LEVEL SECURITY;

-- 策略 1：管理员可以查看所有配置
CREATE POLICY "Admins can view all model configs"
  ON public.model_configs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 策略 2：管理员可以插入配置
CREATE POLICY "Admins can insert model configs"
  ON public.model_configs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 策略 3：管理员可以更新配置
CREATE POLICY "Admins can update model configs"
  ON public.model_configs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 策略 4：管理员可以删除配置
CREATE POLICY "Admins can delete model configs"
  ON public.model_configs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 策略 5：所有认证用户可以查看激活状态的配置（用于 generate-stream 读取）
CREATE POLICY "Authenticated users can view active configs"
  ON public.model_configs
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND status = 'active'
  );

-- 插入默认配置（可选，用于演示）
INSERT INTO public.model_configs (
  type,
  name,
  api_base_url,
  api_key,
  model_name,
  status,
  description
) VALUES (
  'generate-image',
  '默认图片生成配置',
  'https://sssss.zxiaoruan.cn',
  'your-api-key-here',
  'gemini-2.5-flash-image',
  'inactive',
  '这是一个示例配置，请更新为实际的 API 密钥'
) ON CONFLICT DO NOTHING;

