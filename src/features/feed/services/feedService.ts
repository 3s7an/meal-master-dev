import {
  fetchLikesForRecipeIds,
  fetchPublicRecipes,
  fetchSavedRecipeIds,
} from "../api/feedRepository";
import { mapPublicRecipesToFeed } from "../mappers/feedRecipeMapper";
import type { FeedRecipe } from "@/types/recipe";

export type FeedSortBy = "recent" | "popular";

export async function getFeedForUser(
  userId: string,
  sortBy: FeedSortBy = "recent",
): Promise<{ recipes: FeedRecipe[]; error: Error | null }> {
  const { data: recipesData, error: recipesError } = await fetchPublicRecipes();

  if (recipesError) {
    return { recipes: [], error: recipesError };
  }

  const rows = recipesData ?? [];
  const recipeIds = rows.map((row) => row.id);

  const [likesResult, savedResult] = await Promise.all([
    fetchLikesForRecipeIds(recipeIds),
    fetchSavedRecipeIds(userId),
  ]);

  const error = likesResult.error ?? savedResult.error;
  if (error) {
    return { recipes: [], error };
  }

  const savedRecipeIds = new Set((savedResult.data ?? []).map((entry) => entry.recipe_id));

  let recipes = mapPublicRecipesToFeed(rows, {
    userId,
    likes: likesResult.data ?? [],
    savedRecipeIds,
  });

  if (sortBy === "popular") {
    recipes = [...recipes].sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0));
  }

  return { recipes, error: null };
}
