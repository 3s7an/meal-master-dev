-- Fix missing profiles for existing users
-- Spustite tento SQL kód v Supabase SQL Editor

-- Step 1: Create profiles for all existing auth.users that don't have a profile
INSERT INTO public.profiles (id, full_name)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', 'User')
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Step 2: Verify trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Step 3: Create function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'User'));
  RETURN new;
END;
$$;

-- Step 4: Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    
    RAISE NOTICE 'Trigger on_auth_user_created created';
  ELSE
    RAISE NOTICE 'Trigger on_auth_user_created already exists';
  END IF;
END $$;

-- Step 5: Verify all users have profiles
SELECT 
  au.id as user_id,
  au.email,
  p.id as profile_id,
  p.full_name
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC;

