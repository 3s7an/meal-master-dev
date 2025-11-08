-- Allow viewing profiles of users who created public recipes
-- This enables displaying author names in the feed

CREATE POLICY "Anyone can view profiles of public recipe authors"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.recipes 
    WHERE recipes.user_id = profiles.id 
    AND recipes.is_public = true
  )
  OR auth.uid() = id
);

