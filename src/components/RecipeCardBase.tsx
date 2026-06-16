import type { ReactNode } from "react";
import { format } from "date-fns";
import { Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getCategoryOption } from "@/constants/categories";
import type { Recipe } from "@/types/recipe";

type RecipeCardRecipe = Recipe & { author_name?: string | null };

interface RecipeCardBaseProps {
  recipe: RecipeCardRecipe;
  currentUserId: string | null;
  onClick: () => void;
  cardClassName?: string;
  imageFallback?: ReactNode;
  topRightAction?: ReactNode;
  topLeftExtraBadge?: ReactNode;
  bottomAction?: ReactNode;
  hasGradientOverlay?: boolean;
  showAuthor?: boolean;
  authorFallback?: string;
  titleClassName?: string;
}

export function RecipeCardBase({
  recipe,
  currentUserId,
  onClick,
  cardClassName,
  imageFallback,
  topRightAction,
  topLeftExtraBadge,
  bottomAction,
  hasGradientOverlay = false,
  showAuthor,
  authorFallback,
  titleClassName,
}: RecipeCardBaseProps) {
  const shouldShowAuthor = showAuthor ?? !!recipe.user_id;
  const authorDisplay =
    recipe.user_id === currentUserId ? "Ja" : recipe.author_name || authorFallback;

  const content = (
    <>
      <CardTitle
        className={`font-bold text-xl leading-tight break-words line-clamp-2 group-hover:text-primary transition-colors ${titleClassName ?? ""}`}
      >
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
            {imageFallback ?? <Clock className="w-16 h-16 text-muted-foreground" />}
          </div>
        )}

        <div className="absolute top-3 left-3 z-10 flex gap-2">
          {topLeftExtraBadge}
          <Badge className="bg-primary text-primary-foreground whitespace-nowrap shadow-lg">
            {getCategoryOption(recipe.category).label}
          </Badge>
        </div>

        {topRightAction && (
          <div className="absolute top-3 right-3 z-10">{topRightAction}</div>
        )}
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
        {shouldShowAuthor && authorDisplay && (
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span className="font-medium">{authorDisplay}</span>
          </div>
        )}
      </div>

      {bottomAction}
    </>
  );

  return (
    <Card className={cardClassName} onClick={onClick}>
      {hasGradientOverlay ? (
        <div className="flex flex-col p-5 gap-4 bg-transparent relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-lg opacity-50" />
          <div className="relative z-10">{content}</div>
        </div>
      ) : (
        <div className="flex flex-col p-5 gap-4 bg-card">{content}</div>
      )}
    </Card>
  );
}
