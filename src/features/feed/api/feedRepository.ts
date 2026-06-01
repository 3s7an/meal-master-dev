import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type PublicRecipeRow = Database["public"]["Tables"]["recipes"]["Row"] & {
  profiles: { full_name: string | null } | null;
};

export type RecipeLikeRow = Pick<
  Database["public"]["Tables"]["recipe_likes"]["Row"],
  "recipe_id" | "user_id"
>;

export async function fetchPublicRecipes() {
  return supabase
    .from("recipes")
    .select(
      `
        *,
        profiles:user_id (
          full_name
        )
      `,
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false });
}

export async function fetchLikesForRecipeIds(recipeIds: string[]) {
  if (recipeIds.length === 0) {
    return { data: [] as RecipeLikeRow[], error: null };
  }

  return supabase
    .from("recipe_likes")
    .select("recipe_id, user_id")
    .in("recipe_id", recipeIds);
}

export async function fetchSavedRecipeIds(userId: string) {
  return supabase
    .from("saved_recipes")
    .select("recipe_id")
    .eq("user_id", userId);
}

export async function insertRecipeLike(userId: string, recipeId: string) {
  return supabase.from("recipe_likes").insert({ recipe_id: recipeId, user_id: userId });
}

export async function deleteRecipeLike(userId: string, recipeId: string) {
  return supabase
    .from("recipe_likes")
    .delete()
    .eq("recipe_id", recipeId)
    .eq("user_id", userId);
}
