import { normalizeCategory } from "@/constants/categories";
import { parseIngredients } from "@/lib/parseIngredients";
import type { UserRecipe } from "@/types/recipe";
import type { OwnRecipeRow, SavedRecipeEntryRow } from "../api/recipesRepository";

export function toOwnUserRecipe(row: OwnRecipeRow): UserRecipe {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    category: normalizeCategory(row.category),
    ingredients: parseIngredients(row.ingredients),
    instructions: row.instructions,
    image_url: row.image_url ?? undefined,
    calories: row.calories ?? undefined,
    notes: row.notes ?? undefined,
    user_id: row.user_id,
    is_public: row.is_public,
    created_at: row.created_at,
    source: "own",
    author_name: null,
  };
}

export function toSavedUserRecipe(entry: SavedRecipeEntryRow): UserRecipe | null {
  if (!entry.recipes) {
    return null;
  }

  const row = entry.recipes;

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    category: normalizeCategory(row.category),
    ingredients: parseIngredients(row.ingredients),
    instructions: row.instructions,
    image_url: row.image_url ?? undefined,
    calories: row.calories ?? undefined,
    notes: row.notes ?? undefined,
    user_id: row.user_id,
    is_public: row.is_public,
    created_at: row.created_at,
    source: "saved",
    saved_at: entry.created_at,
    author_name: row.profiles?.full_name ?? null,
  };
}

function getSortValue(recipe: UserRecipe): number {
  if (recipe.saved_at) {
    const savedTime = Date.parse(recipe.saved_at);
    if (!Number.isNaN(savedTime)) {
      return savedTime;
    }
  }
  if (recipe.created_at) {
    const createdTime = Date.parse(recipe.created_at);
    if (!Number.isNaN(createdTime)) {
      return createdTime;
    }
  }
  return 0;
}

export function mergeUserRecipes(own: UserRecipe[], saved: UserRecipe[]): UserRecipe[] {
  const combinedMap = new Map<string, UserRecipe>();

  own.forEach((recipe) => {
    combinedMap.set(recipe.id, recipe);
  });

  saved.forEach((recipe) => {
    if (combinedMap.has(recipe.id)) {
      const existing = combinedMap.get(recipe.id)!;
      combinedMap.set(recipe.id, {
        ...existing,
        saved_at: recipe.saved_at,
      });
    } else {
      combinedMap.set(recipe.id, recipe);
    }
  });

  return Array.from(combinedMap.values()).sort(
    (a, b) => getSortValue(b) - getSortValue(a),
  );
}

export function mapOwnRecipes(rows: OwnRecipeRow[]): UserRecipe[] {
  return rows.map(toOwnUserRecipe);
}

export function mapSavedRecipes(entries: SavedRecipeEntryRow[]): UserRecipe[] {
  return entries
    .map(toSavedUserRecipe)
    .filter((recipe): recipe is UserRecipe => recipe !== null);
}
