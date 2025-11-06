-- 添加 generate-prompts 类型到 model_configs 表
-- 执行日期: 2025-11-06
-- 功能: 支持基于图片生成婚纱照提示词的模型配置

-- 1. 删除旧的类型约束
ALTER TABLE public.model_configs 
DROP CONSTRAINT IF EXISTS model_configs_type_check;

-- 2. 添加新的类型约束，包含 generate-prompts
ALTER TABLE public.model_configs 
ADD CONSTRAINT model_configs_type_check 
CHECK (type = ANY (ARRAY['generate-image'::text, 'identify-image'::text, 'generate-prompts'::text, 'other'::text]));

-- 3. 验证约束已正确添加
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.model_configs'::regclass
  AND conname = 'model_configs_type_check';

