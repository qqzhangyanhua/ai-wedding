-- 修复现有数据的SQL脚本
-- 用于修复已存在但图片字段为空的生成记录

-- 1. 查看当前状态
SELECT 
  'Current Status' as info,
  COUNT(*) as total_generations,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
  COUNT(CASE WHEN preview_images IS NOT NULL AND jsonb_array_length(preview_images) > 0 THEN 1 END) as with_images,
  COUNT(CASE WHEN is_shared_to_gallery = true THEN 1 END) as shared_to_gallery
FROM generations;

-- 2. 查看问题记录（已完成但没有图片的）
SELECT 
  g.id,
  g.status,
  g.preview_images,
  g.is_shared_to_gallery,
  g.created_at,
  p.name as project_name,
  p.uploaded_photos
FROM generations g
JOIN projects p ON p.id = g.project_id
WHERE g.status = 'completed'
  AND (g.preview_images IS NULL OR jsonb_array_length(g.preview_images) = 0)
ORDER BY g.created_at DESC
LIMIT 10;

-- 3. 修复已完成但没有图片的记录（使用上传的照片）
UPDATE generations g
SET 
  preview_images = (
    SELECT uploaded_photos 
    FROM projects p 
    WHERE p.id = g.project_id
  )::jsonb,
  updated_at = NOW()
WHERE 
  g.status = 'completed'
  AND (g.preview_images IS NULL OR jsonb_array_length(g.preview_images) = 0)
  AND EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = g.project_id 
    AND p.uploaded_photos IS NOT NULL 
    AND jsonb_array_length(p.uploaded_photos) > 0
  );

-- 4. 修复长时间处于processing状态的记录
UPDATE generations
SET 
  status = 'completed',
  preview_images = (
    SELECT uploaded_photos 
    FROM projects 
    WHERE id = generations.project_id
  )::jsonb,
  completed_at = NOW()
WHERE 
  status = 'processing'
  AND created_at < NOW() - INTERVAL '10 minutes'
  AND EXISTS (
    SELECT 1 FROM projects 
    WHERE id = generations.project_id 
    AND uploaded_photos IS NOT NULL 
    AND jsonb_array_length(uploaded_photos) > 0
  );

-- 5. 验证修复结果
SELECT 
  'After Fix' as info,
  COUNT(*) as total_generations,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN preview_images IS NOT NULL AND jsonb_array_length(preview_images) > 0 THEN 1 END) as with_images,
  COUNT(CASE WHEN is_shared_to_gallery = true AND preview_images IS NOT NULL AND jsonb_array_length(preview_images) > 0 THEN 1 END) as gallery_ready
FROM generations;

-- 6. 查看画廊中的作品（应该能在画廊看到的）
SELECT 
  g.id,
  p.name as project_name,
  t.name as template_name,
  prof.full_name as user_name,
  jsonb_array_length(g.preview_images) as image_count,
  g.created_at
FROM generations g
JOIN projects p ON p.id = g.project_id
JOIN profiles prof ON prof.id = g.user_id
LEFT JOIN templates t ON t.id = g.template_id
WHERE 
  g.is_shared_to_gallery = true
  AND g.status = 'completed'
  AND g.preview_images IS NOT NULL
  AND jsonb_array_length(g.preview_images) > 0
ORDER BY g.created_at DESC;

-- 7. 为测试：手动分享一些已完成的作品到画廊
-- UPDATE generations 
-- SET is_shared_to_gallery = true 
-- WHERE status = 'completed' 
--   AND preview_images IS NOT NULL 
--   AND jsonb_array_length(preview_images) > 0
--   AND is_shared_to_gallery = false
-- LIMIT 5;

