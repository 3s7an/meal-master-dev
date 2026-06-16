import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface RecipeGridProps<T extends { id: string }> {
  recipes: T[];
  loading: boolean;
  searchTerm: string;
  selectedCategory: string | null;
  renderCard: (recipe: T) => ReactNode;
  emptyState?: ReactNode;
}

export function RecipeGrid<T extends { id: string }>({
  recipes,
  loading,
  searchTerm,
  selectedCategory,
  renderCard,
  emptyState,
}: RecipeGridProps<T>) {
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
          {searchTerm || selectedCategory ? (
            <p className="text-muted-foreground mb-4">
              Nenašli sa žiadne recepty zodpovedajúce filtrom.
            </p>
          ) : (
            emptyState
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
      {recipes.map((recipe) => renderCard(recipe))}
    </div>
  );
}
