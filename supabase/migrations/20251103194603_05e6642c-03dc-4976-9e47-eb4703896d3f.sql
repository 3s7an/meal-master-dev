-- Remove the old check constraint on meals_per_day
ALTER TABLE public.meal_plans 
DROP CONSTRAINT IF EXISTS meal_plans_meals_per_day_check;

-- Add a new check constraint that allows 0 or more meals per day
ALTER TABLE public.meal_plans 
ADD CONSTRAINT meal_plans_meals_per_day_check 
CHECK (meals_per_day >= 0);