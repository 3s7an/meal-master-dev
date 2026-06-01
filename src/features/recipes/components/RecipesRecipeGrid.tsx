import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { UserRecipe } from "@/types/recipe";
import { RecipesRecipeCard } from "./RecipesRecipeCard";

interface RecipesRecipeGridProps {
  recipes: UserRecipe[];
  loading: boolean;
  searchTerm: string;
  selectedCategory: string | null;
  currentUserId: string | null;
  onAddNew: () => void;
  onOpenRecipe: (recipe: UserRecipe) => void;
  onToggleSave: (recipeId: string) => void;
}

export function RecipesRecipeGrid({
  recipes,
  loading,
  searchTerm,
  selectedCategory,
  currentUserId,
  onAddNew,
  onOpenRecipe,
  onToggleSave,
}: RecipesRecipeGridProps) {
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
            <>
              <p className="text-muted-foreground mb-4">
                Začnite pridávaním svojich obľúbených receptov
              </p>
              <Button onClick={onAddNew}>
                <Plus className="w-4 h-4 mr-2" />
                Pridať prvý recept
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((recipe) => (
        <RecipesRecipeCard
          key={recipe.id}
          recipe={recipe}
          currentUserId={currentUserId}
          onOpen={onOpenRecipe}
          onToggleSave={onToggleSave}
        />
      ))}
    </div>
  );
}
