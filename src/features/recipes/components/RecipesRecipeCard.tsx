import type { MouseEvent } from "react";
import { format } from "date-fns";
import { BookmarkMinus, Clock, User, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getCategoryOption } from "@/constants/categories";
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
    <Card
      className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col group border shadow-md hover:-translate-y-1"
      onClick={() => onOpen(recipe)}
    >
      <div className="flex flex-col p-5 gap-4 bg-card">
        <CardTitle className="font-bold text-xl leading-tight break-words line-clamp-2 group-hover:text-primary transition-colors">
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
              <Users className="w-16 h-16 text-muted-foreground" />
            </div>
          )}

          <div className="absolute top-3 left-3 z-10 flex gap-2">
            {recipe.source === "saved" && (
              <Badge variant="secondary" className="shadow-lg">
                Uložené
              </Badge>
            )}
            <Badge className="bg-primary text-primary-foreground whitespace-nowrap shadow-lg">
              {getCategoryOption(recipe.category).label}
            </Badge>
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
          {recipe.user_id && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span className="font-medium">
                {recipe.user_id === currentUserId ? "Ja" : recipe.author_name || "Neznámy autor"}
              </span>
            </div>
          )}
        </div>

        {recipe.source === "saved" && (
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
        )}
      </div>
    </Card>
  );
}
