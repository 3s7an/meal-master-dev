-- Add is_public column to recipes table
ALTER TABLE public.recipes 
ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- Create recipe_likes table for tracking likes
CREATE TABLE public.recipe_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

-- Enable RLS on recipe_likes
ALTER TABLE public.recipe_likes ENABLE ROW LEVEL SECURITY;

-- Create saved_recipes table for users saving others' recipes
CREATE TABLE public.saved_recipes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

-- Enable RLS on saved_recipes
ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;

-- Update RLS policies for recipes to allow reading public recipes
CREATE POLICY "Anyone can view public recipes"
ON public.recipes
FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view own recipes" ON public.recipes;

-- RLS policies for recipe_likes
CREATE POLICY "Users can create likes"
ON public.recipe_likes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
ON public.recipe_likes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view likes"
ON public.recipe_likes
FOR SELECT
USING (true);

-- RLS policies for saved_recipes
CREATE POLICY "Users can save recipes"
ON public.saved_recipes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete saved recipes"
ON public.saved_recipes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own saved recipes"
ON public.saved_recipes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_recipe_likes_recipe_id ON public.recipe_likes(recipe_id);
CREATE INDEX idx_recipe_likes_user_id ON public.recipe_likes(user_id);
CREATE INDEX idx_saved_recipes_user_id ON public.saved_recipes(user_id);
CREATE INDEX idx_recipes_is_public ON public.recipes(is_public);
CREATE INDEX idx_recipes_created_at ON public.recipes(created_at DESC);