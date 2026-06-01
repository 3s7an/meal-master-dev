import type { MouseEvent } from "react";
import { format } from "date-fns";
import { Clock, Heart, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getCategoryOption } from "@/constants/categories";
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
    <Card
      className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col group border-0 shadow-lg hover:-translate-y-1 bg-gradient-to-br from-background/80 via-primary/5 to-background/60 backdrop-blur-sm"
      onClick={() => onOpenRecipe(recipe)}
    >
      <div className="flex flex-col p-5 gap-4 bg-transparent relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-lg opacity-50" />
        <div className="relative z-10">
          <CardTitle className="font-bold text-xl leading-tight break-words line-clamp-2 group-hover:text-primary transition-colors mb-6">
            {recipe.name}
          </CardTitle>

          <div className="relative w-full aspect-[9/7] overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10">
            {recipe.image_url ? (
              <img
                src={recipe.image_url}
                alt={recipe.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Clock className="w-16 h-16 text-muted-foreground" />
              </div>
            )}

            <div className="absolute top-3 left-3 z-10">
              <Badge className="bg-primary text-primary-foreground whitespace-nowrap shadow-lg">
                {getCategoryOption(recipe.category).label}
              </Badge>
            </div>

            <div className="absolute top-3 right-3 z-10">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-1 bg-background/90 hover:bg-background shadow-lg ${recipe.is_liked ? "text-red-500" : "text-foreground"}`}
                onClick={(e) => onToggleLike(recipe.id, e)}
              >
                <Heart className={`w-4 h-4 ${recipe.is_liked ? "fill-current" : ""}`} />
                <span>{recipe.likes_count || 0}</span>
              </Button>
            </div>
          </div>

          <CardDescription className="text-sm text-muted-foreground line-clamp-2">
            {recipe.description}
          </CardDescription>

          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            {recipe.calories && (
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground">{recipe.calories}</span>
                <span>kcal</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span className="font-medium text-foreground">{recipe.ingredients?.length || 0}</span>
              <span>ingrediencií</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 mt-auto">
            {recipe.created_at && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{format(new Date(recipe.created_at), "d.M.yyyy")}</span>
              </div>
            )}
            {recipe.author_name && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span className="font-medium">
                  {recipe.user_id === currentUserId ? "Ja" : recipe.author_name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
