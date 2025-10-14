-- Migration: Add gallery sharing functionality
-- Date: 2025-01-14
-- Description: Add is_shared_to_gallery field to generations table

-- Add the new column
ALTER TABLE generations ADD COLUMN IF NOT EXISTS is_shared_to_gallery boolean DEFAULT false;

-- Add index for efficient gallery queries
CREATE INDEX IF NOT EXISTS idx_generations_shared_gallery 
ON generations(is_shared_to_gallery, created_at DESC) 
WHERE is_shared_to_gallery = true;

-- Add RLS policy for public gallery access (read-only)
CREATE POLICY IF NOT EXISTS "Gallery items are publicly readable" 
ON generations FOR SELECT 
TO anon, authenticated 
USING (is_shared_to_gallery = true AND status = 'completed');

-- Update existing policy to allow users to update sharing status
DROP POLICY IF EXISTS "Users can update own generations" ON generations;
CREATE POLICY "Users can update own generations" 
ON generations FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);
