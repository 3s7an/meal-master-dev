# Nastavenie Supabase Storage pre obrázky receptov

## Problém: "Bucket not found"

Ak vidíte chybu "Bucket not found" pri nahrávaní obrázkov, bucket `recipe-images` ešte neexistuje.

## Riešenie 1: Vytvorenie bucketu cez Supabase Dashboard (odporúčané)

1. Otvorte [Supabase Dashboard](https://app.supabase.com)
2. Vyberte váš projekt
3. Prejdite na **Storage** v ľavom menu
4. Kliknite na **New bucket**
5. Nastavte:
   - **Name**: `recipe-images`
   - **Public bucket**: ✅ (zaškrtnuté)
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/webp`
6. Kliknite na **Create bucket**

## Riešenie 2: Spustenie migrácie

Ak chcete použiť migráciu:

1. V Supabase Dashboard prejdite na **SQL Editor**
2. Vytvorte nový query
3. Skopírujte obsah súboru `supabase/migrations/20251108175755_create_recipe_images_bucket.sql`
4. Spustite query

## Riešenie 3: Vytvorenie bucketu cez SQL Editor

Spustite tento SQL kód v Supabase SQL Editor:

```sql
-- Create storage bucket for recipe images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recipe-images',
  'recipe-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
```

## Nastavenie RLS policies

Po vytvorení bucketu je potrebné nastaviť RLS policies. Spustite tento SQL kód:

```sql
-- RLS policies for recipe-images bucket
CREATE POLICY "Users can upload recipe images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recipe-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own recipe images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'recipe-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own recipe images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'recipe-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view recipe images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'recipe-images');
```

## Overenie

Po vytvorení bucketu by ste mali byť schopní nahrávať obrázky v dialógu na vytvorenie/úpravu receptu.

