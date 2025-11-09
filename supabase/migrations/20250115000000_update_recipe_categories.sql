-- Update recipe categories constraint to match new category values
-- First, migrate existing data from old values to new values
UPDATE public.recipes
SET category = CASE
  WHEN category = 'breakfast' THEN 'ranajky'
  WHEN category = 'lunch' THEN 'hlavne_jedlo'
  WHEN category = 'dinner' THEN 'vecera'
  WHEN category = 'snack' THEN 'snack'
  ELSE 'ranajky' -- Default fallback
END
WHERE category IN ('breakfast', 'lunch', 'dinner', 'snack');

-- Drop the old check constraint (PostgreSQL auto-generated name is recipes_category_check)
ALTER TABLE public.recipes
DROP CONSTRAINT IF EXISTS recipes_category_check;

-- Also try to drop any other possible constraint names
DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  -- Find and drop all check constraints on the category column
  FOR constraint_record IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.recipes'::regclass
      AND contype = 'c'
      AND (
        pg_get_constraintdef(oid) LIKE '%category%'
        OR conname LIKE '%category%'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.recipes DROP CONSTRAINT IF EXISTS %I', constraint_record.conname);
  END LOOP;
END $$;

-- Add new check constraint with updated category values
ALTER TABLE public.recipes
ADD CONSTRAINT recipes_categories_check
CHECK (category IN ('ranajky', 'snack', 'polievka', 'hlavne_jedlo', 'vecera'));

