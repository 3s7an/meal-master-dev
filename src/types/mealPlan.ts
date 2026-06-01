import type { Json } from "@/integrations/supabase/types";

export interface MealPlanData {
  meal_types?: string[];
  [key: string]: Json | string[] | undefined;
}

export interface MealPlan {
  id: string;
  name: string;
  plan_type: string;
  meals_per_day: number;
  start_date: string;
  plan_data: MealPlanData;
}

export interface MealPlanRecipeOption {
  id: string;
  name: string;
  category: string;
}

export interface MealPlanWritePayload {
  user_id: string;
  name: string;
  plan_type: string;
  meals_per_day: number;
  start_date: string;
  plan_data: MealPlanData;
}
