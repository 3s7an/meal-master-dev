-- Recreate recipe-images bucket
-- Spustite tento SQL kód v Supabase SQL Editor

-- Step 1: Delete existing bucket (if exists)
-- WARNING: This will delete all files in the bucket!
DELETE FROM storage.buckets WHERE id = 'recipe-images';

-- Step 2: Create bucket fresh
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recipe-images',
  'recipe-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Step 3: Verify
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets 
WHERE id = 'recipe-images';

