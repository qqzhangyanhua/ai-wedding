-- Migration: Add gallery sharing functionality (Fixed Version)
-- Date: 2025-01-14
-- Description: Add is_shared_to_gallery field to generations table

-- 1. 添加 is_shared_to_gallery 字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'generations' AND column_name = 'is_shared_to_gallery'
    ) THEN
        ALTER TABLE generations ADD COLUMN is_shared_to_gallery boolean DEFAULT false;
    END IF;
END $$;

-- 2. 添加索引（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_generations_shared_gallery'
    ) THEN
        CREATE INDEX idx_generations_shared_gallery 
        ON generations(is_shared_to_gallery, created_at DESC) 
        WHERE is_shared_to_gallery = true;
    END IF;
END $$;

-- 3. 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Gallery items are publicly readable" ON generations;

-- 4. 创建新的公开访问策略
CREATE POLICY "Gallery items are publicly readable" 
ON generations FOR SELECT 
TO anon, authenticated 
USING (is_shared_to_gallery = true AND status = 'completed');

-- 5. 更新用户更新策略
DROP POLICY IF EXISTS "Users can update own generations" ON generations;

CREATE POLICY "Users can update own generations" 
ON generations FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 6. 验证结果
SELECT 
    'Migration completed' as status,
    COUNT(*) as total_generations,
    COUNT(CASE WHEN is_shared_to_gallery = true THEN 1 END) as shared_count
FROM generations;
