import type { MouseEvent } from "react";
import { RecipeGrid } from "@/components/RecipeGrid";
import type { FeedRecipe } from "@/types/recipe";
import { FeedRecipeCard } from "./FeedRecipeCard";

interface FeedRecipeGridProps {
  recipes: FeedRecipe[];
  loading: boolean;
  searchTerm: string;
  selectedCategory: string | null;
  currentUserId: string | null;
  onOpenRecipe: (recipe: FeedRecipe) => void;
  onToggleLike: (recipeId: string, e: MouseEvent) => void;
}

export function FeedRecipeGrid({
  recipes,
  loading,
  searchTerm,
  selectedCategory,
  currentUserId,
  onOpenRecipe,
  onToggleLike,
}: FeedRecipeGridProps) {
  return (
    <RecipeGrid
      recipes={recipes}
      loading={loading}
      searchTerm={searchTerm}
      selectedCategory={selectedCategory}
      emptyState={<p className="text-muted-foreground mb-4">Zatiaľ nie sú žiadne verejné recepty.</p>}
      renderCard={(recipe) => (
        <FeedRecipeCard
          key={recipe.id}
          recipe={recipe}
          currentUserId={currentUserId}
          onOpenRecipe={onOpenRecipe}
          onToggleLike={onToggleLike}
        />
      )}
    />
  );
}
