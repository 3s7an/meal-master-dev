import { normalizeCategory } from "@/constants/categories";
import type { FeedRecipe, Ingredient } from "@/types/recipe";
import type { Json } from "@/integrations/supabase/types";
import type { PublicRecipeRow, RecipeLikeRow } from "../api/feedRepository";

function parseIngredients(raw: Json): Ingredient[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      name: String(item.name ?? ""),
      quantity: Number(item.quantity) || 0,
      unit: String(item.unit ?? ""),
    }));
}

export interface FeedRecipeMapperContext {
  userId: string;
  likes: RecipeLikeRow[];
  savedRecipeIds: Set<string>;
}

export function toFeedRecipe(row: PublicRecipeRow, ctx: FeedRecipeMapperContext): FeedRecipe {
  const recipeLikes = ctx.likes.filter((like) => like.recipe_id === row.id);

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
    author_name: row.profiles?.full_name ?? null,
    likes_count: recipeLikes.length,
    is_liked: recipeLikes.some((like) => like.user_id === ctx.userId),
    is_saved: ctx.savedRecipeIds.has(row.id),
  };
}

export function mapPublicRecipesToFeed(
  rows: PublicRecipeRow[],
  ctx: FeedRecipeMapperContext,
): FeedRecipe[] {
  return rows.map((row) => toFeedRecipe(row, ctx));
}
