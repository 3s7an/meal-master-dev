-- RLS policies for recipe-images bucket
-- Spustite tento SQL kód v Supabase Dashboard > SQL Editor

-- Allow authenticated users to upload images
CREATE POLICY "Users can upload recipe images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recipe-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update own recipe images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'recipe-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete own recipe images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'recipe-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to recipe images
CREATE POLICY "Anyone can view recipe images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'recipe-images');

