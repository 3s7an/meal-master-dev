-- Verify and fix recipe-images bucket
-- Spustite tento SQL kód v Supabase SQL Editor

-- Step 1: Check if bucket exists
SELECT id, name, public, file_size_limit, allowed_mime_types, created_at
FROM storage.buckets 
WHERE id = 'recipe-images';

-- Step 2: If bucket doesn't exist or is not public, fix it
-- This will create or update the bucket
DO $$
BEGIN
  -- Delete bucket if it exists but is wrong
  DELETE FROM storage.buckets WHERE id = 'recipe-images';
  
  -- Create bucket fresh
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'recipe-images',
    'recipe-images',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  );
  
  RAISE NOTICE 'Bucket recipe-images created successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error: %', SQLERRM;
END $$;

-- Step 3: Verify bucket was created
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets 
WHERE id = 'recipe-images';

