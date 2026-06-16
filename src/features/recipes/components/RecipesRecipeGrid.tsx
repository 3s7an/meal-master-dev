import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecipeGrid } from "@/components/RecipeGrid";
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
  return (
    <RecipeGrid
      recipes={recipes}
      loading={loading}
      searchTerm={searchTerm}
      selectedCategory={selectedCategory}
      emptyState={
        <>
          <p className="text-muted-foreground mb-4">Začnite pridávaním svojich obľúbených receptov</p>
          <Button onClick={onAddNew}>
            <Plus className="w-4 h-4 mr-2" />
            Pridať prvý recept
          </Button>
        </>
      }
      renderCard={(recipe) => (
        <RecipesRecipeCard
          key={recipe.id}
          recipe={recipe}
          currentUserId={currentUserId}
          onOpen={onOpenRecipe}
          onToggleSave={onToggleSave}
        />
      )}
    />
  );
}
