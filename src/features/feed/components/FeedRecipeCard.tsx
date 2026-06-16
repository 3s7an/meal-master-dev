import type { MouseEvent } from "react";
import { Clock, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecipeCardBase } from "@/components/RecipeCardBase";
import type { FeedRecipe } from "@/types/recipe";

interface FeedRecipeCardProps {
  recipe: FeedRecipe;
  currentUserId: string | null;
  onOpenRecipe: (recipe: FeedRecipe) => void;
  onToggleLike: (recipeId: string, e: MouseEvent) => void;
}

export function FeedRecipeCard({
  recipe,
  currentUserId,
  onOpenRecipe,
  onToggleLike,
}: FeedRecipeCardProps) {
  return (
    <RecipeCardBase
      recipe={recipe}
      currentUserId={currentUserId}
      onClick={() => onOpenRecipe(recipe)}
      cardClassName="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col group border-0 shadow-lg hover:-translate-y-1 bg-gradient-to-br from-background/80 via-primary/5 to-background/60 backdrop-blur-sm"
      imageFallback={<Clock className="w-16 h-16 text-muted-foreground" />}
      topRightAction={
        <Button
          variant="ghost"
          size="sm"
          className={`gap-1 bg-background/90 hover:bg-background shadow-lg ${recipe.is_liked ? "text-red-500" : "text-foreground"}`}
          onClick={(e) => onToggleLike(recipe.id, e)}
        >
          <Heart className={`w-4 h-4 ${recipe.is_liked ? "fill-current" : ""}`} />
          <span>{recipe.likes_count || 0}</span>
        </Button>
      }
      hasGradientOverlay
      showAuthor={!!recipe.author_name}
      titleClassName="mb-6"
    />
  );
}
