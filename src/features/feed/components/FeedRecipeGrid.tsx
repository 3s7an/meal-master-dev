import type { MouseEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Načítavam recepty...</p>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent className="pt-6">
          <p className="text-muted-foreground mb-4">
            {searchTerm || selectedCategory
              ? "Nenašli sa žiadne recepty zodpovedajúce filtrom."
              : "Zatiaľ nie sú žiadne verejné recepty."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((recipe) => (
        <FeedRecipeCard
          key={recipe.id}
          recipe={recipe}
          currentUserId={currentUserId}
          onOpenRecipe={onOpenRecipe}
          onToggleLike={onToggleLike}
        />
      ))}
    </div>
  );
}
