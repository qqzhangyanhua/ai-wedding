-- 单张生成历史记录表
-- 用于存储用户通过 /generate-single 生成的图片记录

-- 创建 single_generations 表
CREATE TABLE IF NOT EXISTS single_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  prompt text NOT NULL,
  original_image text NOT NULL,
  result_image text NOT NULL,
  settings jsonb DEFAULT '{}',
  credits_used integer DEFAULT 15,
  created_at timestamptz DEFAULT now()
);

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_single_generations_user_id ON single_generations(user_id, created_at DESC);

-- 启用行级安全策略
ALTER TABLE single_generations ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：用户只能查看自己的记录
CREATE POLICY "Users can view own single generations" 
  ON single_generations 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- 创建 RLS 策略：用户只能插入自己的记录
-- 注意：插入时 user_id 会自动设置为当前用户，所以不需要在 WITH CHECK 中验证
CREATE POLICY "Users can insert own single generations" 
  ON single_generations 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- 创建 RLS 策略：用户只能删除自己的记录
CREATE POLICY "Users can delete own single generations" 
  ON single_generations 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- 添加注释说明
COMMENT ON TABLE single_generations IS '单张生成历史记录表，存储用户通过单张生成功能创建的图片';
COMMENT ON COLUMN single_generations.prompt IS '用户输入的提示词';
COMMENT ON COLUMN single_generations.original_image IS '原始上传的图片 URL';
COMMENT ON COLUMN single_generations.result_image IS '生成结果图片 URL';
COMMENT ON COLUMN single_generations.settings IS '生成时的设置参数（五官保持强度、创意程度等）';
COMMENT ON COLUMN single_generations.credits_used IS '本次生成消耗的积分数';

