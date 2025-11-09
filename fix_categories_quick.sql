-- Quick fix: Drop the old constraint and create a new one
ALTER TABLE public.recipes
DROP CONSTRAINT IF EXISTS recipes_category_check;

-- Migrate existing data
UPDATE public.recipes
SET category = CASE
  WHEN category = 'breakfast' THEN 'ranajky'
  WHEN category = 'lunch' THEN 'hlavne_jedlo'
  WHEN category = 'dinner' THEN 'vecera'
  WHEN category = 'snack' THEN 'snack'
  ELSE 'ranajky'
END
WHERE category IN ('breakfast', 'lunch', 'dinner', 'snack');

-- Add new constraint
ALTER TABLE public.recipes
ADD CONSTRAINT recipes_categories_check
CHECK (category IN ('ranajky', 'snack', 'polievka', 'hlavne_jedlo', 'vecera'));

