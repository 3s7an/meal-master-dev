import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import type { Ingredient } from "@/types/recipe";

export type OwnRecipeRow = Database["public"]["Tables"]["recipes"]["Row"];

export type SavedRecipeEntryRow = {
  id: string;
  created_at: string;
  recipes:
    | (OwnRecipeRow & {
        profiles: { full_name: string | null } | null;
      })
    | null;
};

export type RecipeWritePayload = {
  user_id: string;
  name: string;
  description: string;
  category: string;
  ingredients: Ingredient[];
  instructions: string;
  calories: number | null;
  notes: string;
  is_public: boolean;
  image_url: string | null;
};

export async function fetchOwnRecipes(userId: string) {
  return supabase
    .from("recipes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
}

export async function fetchSavedRecipesWithDetails(userId: string) {
  return supabase
    .from("saved_recipes")
    .select(
      `
        id,
        created_at,
        recipes(
          *,
          profiles:user_id (
            full_name
          )
        )
      `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
}

export async function createRecipe(recipeData: RecipeWritePayload) {
  return supabase
    .from("recipes")
    .insert({
      ...recipeData,
      ingredients: recipeData.ingredients as unknown as Json,
    })
    .select()
    .single();
}

export async function updateRecipe(recipeId: string, recipeData: RecipeWritePayload) {
  return supabase
    .from("recipes")
    .update({
      ...recipeData,
      ingredients: recipeData.ingredients as unknown as Json,
    })
    .eq("id", recipeId)
    .select()
    .single();
}

export async function deleteRecipe(recipeId: string) {
  return supabase.from("recipes").delete().eq("id", recipeId);
}

export async function updateRecipeImageUrl(recipeId: string, imageUrl: string) {
  return supabase.from("recipes").update({ image_url: imageUrl }).eq("id", recipeId);
}

export async function removeOldRecipeImages(userId: string, recipeId: string) {
  const { data: oldFiles } = await supabase.storage
    .from("recipe-images")
    .list(`${userId}/`, { search: recipeId });

  if (oldFiles && oldFiles.length > 0) {
    await supabase.storage
      .from("recipe-images")
      .remove(oldFiles.map((file) => `${userId}/${file.name}`));
  }
}

export async function uploadRecipeImage(
  userId: string,
  file: File,
  recipeId?: string,
) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${recipeId || Date.now()}.${fileExt}`;

  if (recipeId) {
    try {
      await removeOldRecipeImages(userId, recipeId);
    } catch (error) {
      console.warn("Error deleting old image:", error);
    }
  }

  const { error: uploadError } = await supabase.storage
    .from("recipe-images")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    return { publicUrl: null, error: uploadError };
  }

  const { data } = supabase.storage.from("recipe-images").getPublicUrl(fileName);

  return { publicUrl: data.publicUrl, error: null };
}

export async function insertShoppingListItems(
  items: {
    user_id: string;
    item_name: string;
    quantity: number | null;
    unit: string | null;
    recipe_id: string;
    is_checked: boolean;
  }[],
) {
  return supabase.from("shopping_list").insert(items);
}
