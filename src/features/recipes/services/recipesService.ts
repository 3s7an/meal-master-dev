import {
  fetchOwnRecipes,
  fetchSavedRecipesWithDetails,
} from "../api/recipesRepository";
import {
  mapOwnRecipes,
  mapSavedRecipes,
  mergeUserRecipes,
} from "../mappers/userRecipeMapper";
import type { SavedRecipeEntryRow } from "../api/recipesRepository";
import type { UserRecipe } from "@/types/recipe";

export async function getRecipesForUser(
  userId: string,
): Promise<{ recipes: UserRecipe[]; error: Error | null }> {
  const [ownResult, savedResult] = await Promise.all([
    fetchOwnRecipes(userId),
    fetchSavedRecipesWithDetails(userId),
  ]);

  const error = ownResult.error ?? savedResult.error;
  if (error) {
    return { recipes: [], error };
  }

  const recipes = mergeUserRecipes(
    mapOwnRecipes(ownResult.data ?? []),
    mapSavedRecipes((savedResult.data ?? []) as SavedRecipeEntryRow[]),
  );

  return { recipes, error: null };
}
