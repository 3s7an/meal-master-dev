import { supabase } from "@/integrations/supabase/client";

export async function insertSavedRecipe(userId: string, recipeId: string) {
  return supabase.from("saved_recipes").insert({ recipe_id: recipeId, user_id: userId });
}

export async function deleteSavedRecipe(userId: string, recipeId: string) {
  return supabase
    .from("saved_recipes")
    .delete()
    .eq("recipe_id", recipeId)
    .eq("user_id", userId);
}
