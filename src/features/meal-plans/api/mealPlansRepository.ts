import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import type { MealPlanWritePayload } from "@/types/mealPlan";

export type MealPlanRow = Database["public"]["Tables"]["meal_plans"]["Row"];

export async function fetchMealPlans(userId: string) {
  return supabase
    .from("meal_plans")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
}

export async function createMealPlan(data: MealPlanWritePayload) {
  return supabase.from("meal_plans").insert({
    ...data,
    plan_data: data.plan_data as unknown as Json,
  });
}

export async function updateMealPlan(planId: string, userId: string, data: MealPlanWritePayload) {
  return supabase
    .from("meal_plans")
    .update({
      ...data,
      plan_data: data.plan_data as unknown as Json,
    })
    .eq("id", planId)
    .eq("user_id", userId);
}

export async function deleteMealPlan(planId: string, userId: string) {
  return supabase.from("meal_plans").delete().eq("id", planId).eq("user_id", userId);
}

export async function fetchRecipesForPicker() {
  return supabase.from("recipes").select("id, name, category").order("name");
}

export async function fetchRecipeNames() {
  return supabase.from("recipes").select("id, name").order("name");
}

export async function fetchRecipesWithIngredients(recipeIds: string[]) {
  if (recipeIds.length === 0) {
    return { data: [], error: null };
  }

  return supabase.from("recipes").select("id, name, ingredients").in("id", recipeIds);
}

export async function insertPlanShoppingListItems(
  items: {
    user_id: string;
    item_name: string;
    quantity: number | null;
    unit: string | null;
    is_checked: boolean;
  }[],
) {
  return supabase.from("shopping_list").insert(items);
}
