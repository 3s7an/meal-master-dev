import type { MouseEvent } from "react";
import { format } from "date-fns";
import { Heart, Minus, Plus, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCategoryOption } from "@/constants/categories";
import type { FeedRecipe } from "@/types/recipe";

interface FeedRecipeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: FeedRecipe | null;
  currentUserId: string | null;
  onToggleLike: (recipeId: string, e: MouseEvent) => void;
  onToggleSave: (recipeId: string) => void;
}

export function FeedRecipeModal({
  open,
  onOpenChange,
  recipe,
  currentUserId,
  onToggleLike,
  onToggleSave,
}: FeedRecipeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] md:w-full max-w-[95vw] md:max-w-2xl overflow-x-hidden">
        <DialogHeader className="w-full max-w-full">
          <DialogTitle className="break-words">{recipe?.name}</DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2 flex-wrap">
              {recipe && (
                <Badge className={getCategoryOption(recipe.category).badgeClass}>
                  {getCategoryOption(recipe.category).label}
                </Badge>
              )}
              {recipe?.author_name && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <User className="w-3 h-3" />
                  <span>
                    {recipe.user_id === currentUserId ? "Ja" : recipe.author_name}
                  </span>
                </div>
              )}
              {recipe?.created_at && (
                <div className="text-sm text-muted-foreground">
                  {format(new Date(recipe.created_at), "d.M.yyyy")}
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        {recipe && (
          <div className="space-y-6 w-full max-w-full overflow-x-hidden">
            {recipe.image_url && (
              <div className="relative w-full aspect-[4/3] md:aspect-[3/2] overflow-hidden rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
                <img
                  src={recipe.image_url}
                  alt={recipe.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="w-full max-w-full">
              <Label>Popis</Label>
              <p className="text-sm text-muted-foreground mt-1 break-words">{recipe.description}</p>
            </div>

            <div className="w-full max-w-full">
              <Label>Ingrediencie ({recipe.ingredients?.length || 0})</Label>
              <ul className="list-disc list-inside space-y-1 mt-2">
                {recipe.ingredients?.map((ingredient, idx) => (
                  <li key={idx} className="text-sm break-words">
                    {ingredient.name}
                    {ingredient.quantity && ingredient.quantity !== 1
                      ? ` - ${ingredient.quantity}`
                      : ""}
                    {ingredient.unit ? ` ${ingredient.unit}` : ""}
                  </li>
                ))}
              </ul>
            </div>

            {recipe.instructions && (
              <div className="w-full max-w-full">
                <Label>Postup prípravy</Label>
                <Textarea
                  value={recipe.instructions}
                  readOnly
                  className="mt-2 min-h-[120px] w-full max-w-full resize-none"
                />
              </div>
            )}

            {recipe.calories && (
              <div>
                <Label>Kalórie</Label>
                <p className="text-sm text-muted-foreground mt-1">{recipe.calories} kcal</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-4 w-full max-w-full">
              <Button
                variant="outline"
                className="gap-2 w-full sm:w-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLike(recipe.id, e);
                }}
              >
                <Heart
                  className={`w-4 h-4 ${recipe.is_liked ? "fill-current text-red-500" : ""}`}
                />
                {recipe.is_liked ? "Odobrať lajk" : "Lajkovať"}
                <span className="text-muted-foreground">({recipe.likes_count || 0})</span>
              </Button>
              {recipe.user_id !== currentUserId && (
                <Button
                  onClick={() => onToggleSave(recipe.id)}
                  className="gap-2 w-full sm:w-auto"
                  variant={recipe.is_saved ? "destructive" : "default"}
                >
                  {recipe.is_saved ? (
                    <Minus className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">
                    {recipe.is_saved ? "Odobrať z mojich receptov" : "Pridať do mojich receptov"}
                  </span>
                  <span className="sm:hidden">{recipe.is_saved ? "Odobrať" : "Pridať"}</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
