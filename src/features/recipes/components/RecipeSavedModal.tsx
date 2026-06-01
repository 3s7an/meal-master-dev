import { format } from "date-fns";
import { BookmarkMinus, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCategoryOption } from "@/constants/categories";
import type { UserRecipe } from "@/types/recipe";

interface RecipeSavedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: UserRecipe | null;
  currentUserId: string | null;
  onToggleSave: (recipeId: string) => void;
}

export function RecipeSavedModal({
  open,
  onOpenChange,
  recipe,
  currentUserId,
  onToggleSave,
}: RecipeSavedModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{recipe?.name}</DialogTitle>
          {recipe && (
            <DialogDescription>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={getCategoryOption(recipe.category).badgeClass}>
                  {getCategoryOption(recipe.category).label}
                </Badge>
                <Badge variant="secondary">Uložené</Badge>
                {recipe.user_id && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span>
                      {recipe.user_id === currentUserId
                        ? "Ja"
                        : recipe.author_name || "Neznámy autor"}
                    </span>
                  </div>
                )}
                {recipe.created_at && (
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(recipe.created_at), "d.M.yyyy")}
                  </div>
                )}
              </div>
            </DialogDescription>
          )}
        </DialogHeader>

        {recipe && (
          <div className="space-y-6">
            {recipe.description && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">Popis</h3>
                <p className="mt-1 text-sm text-muted-foreground">{recipe.description}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">
                Ingrediencie ({recipe.ingredients?.length || 0})
              </h3>
              <ul className="list-disc list-inside space-y-1 mt-2">
                {recipe.ingredients?.map((ingredient, idx) => (
                  <li key={idx} className="text-sm">
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
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">Postup prípravy</h3>
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                  {recipe.instructions}
                </p>
              </div>
            )}

            {recipe.calories && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">Kalórie</h3>
                <p className="mt-1 text-sm text-muted-foreground">{recipe.calories} kcal</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="destructive"
                className="gap-2"
                onClick={() => onToggleSave(recipe.id)}
              >
                <BookmarkMinus className="w-4 h-4" />
                Odobrať z uložených
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
