import type { MouseEvent } from "react";
import { BookmarkMinus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecipeCardBase } from "@/components/RecipeCardBase";
import type { UserRecipe } from "@/types/recipe";

interface RecipesRecipeCardProps {
  recipe: UserRecipe;
  currentUserId: string | null;
  onOpen: (recipe: UserRecipe) => void;
  onToggleSave: (recipeId: string) => void;
}

export function RecipesRecipeCard({
  recipe,
  currentUserId,
  onOpen,
  onToggleSave,
}: RecipesRecipeCardProps) {
  return (
    <RecipeCardBase
      recipe={recipe}
      currentUserId={currentUserId}
      onClick={() => onOpen(recipe)}
      cardClassName="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col group border shadow-md hover:-translate-y-1"
      imageFallback={<Users className="w-16 h-16 text-muted-foreground" />}
      topLeftExtraBadge={
        recipe.source === "saved" ? (
          <Badge variant="secondary" className="shadow-lg">
            Uložené
          </Badge>
        ) : undefined
      }
      bottomAction={
        recipe.source === "saved" ? (
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-destructive mt-2"
            onClick={(e: MouseEvent) => {
              e.stopPropagation();
              onToggleSave(recipe.id);
            }}
          >
            <BookmarkMinus className="w-4 h-4" />
            Odobrať z uložených
          </Button>
        ) : undefined
      }
      showAuthor={!!recipe.user_id}
      authorFallback="Neznámy autor"
    />
  );
}
