-- Make quantity nullable in shopping_list table
-- This allows adding items to shopping list without quantity (only name is required)
-- Spustite tento SQL kód v Supabase SQL Editor

ALTER TABLE public.shopping_list
ALTER COLUMN quantity DROP NOT NULL;

-- Remove default value since it's now nullable
ALTER TABLE public.shopping_list
ALTER COLUMN quantity DROP DEFAULT;

