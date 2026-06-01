import type { Dispatch, MouseEvent, SetStateAction } from "react";
import { useToast } from "@/hooks/use-toast";
import type { FeedRecipe } from "@/types/recipe";
import {
  deleteRecipeLike,
  deleteSavedRecipe,
  insertRecipeLike,
  insertSavedRecipe,
} from "../api/feedRepository";

interface UseFeedMutationsOptions {
  userId: string | undefined;
  recipes: FeedRecipe[];
  setRecipes: Dispatch<SetStateAction<FeedRecipe[]>>;
  selectedRecipe: FeedRecipe | null;
  setSelectedRecipe: Dispatch<SetStateAction<FeedRecipe | null>>;
  onSaveSuccess?: () => void;
}

function updateRecipeInList(
  list: FeedRecipe[],
  recipeId: string,
  patch: Partial<FeedRecipe>,
): FeedRecipe[] {
  return list.map((recipe) => (recipe.id === recipeId ? { ...recipe, ...patch } : recipe));
}

export function useFeedMutations({
  userId,
  recipes,
  setRecipes,
  selectedRecipe,
  setSelectedRecipe,
  onSaveSuccess,
}: UseFeedMutationsOptions) {
  const { toast } = useToast();

  const toggleLike = async (recipeId: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;

    const recipe = recipes.find((item) => item.id === recipeId);
    if (!recipe) return;

    const wasLiked = recipe.is_liked;
    const newLikesCount = wasLiked
      ? (recipe.likes_count ?? 0) - 1
      : (recipe.likes_count ?? 0) + 1;

    const patch = { is_liked: !wasLiked, likes_count: newLikesCount };

    setRecipes((prev) => updateRecipeInList(prev, recipeId, patch));

    if (selectedRecipe?.id === recipeId) {
      setSelectedRecipe((prev) => (prev ? { ...prev, ...patch } : null));
    }

    const rollback = () => {
      const rollbackPatch = {
        is_liked: wasLiked,
        likes_count: recipe.likes_count ?? 0,
      };
      setRecipes((prev) => updateRecipeInList(prev, recipeId, rollbackPatch));
      if (selectedRecipe?.id === recipeId) {
        setSelectedRecipe((prev) => (prev ? { ...prev, ...rollbackPatch } : null));
      }
    };

    const { error } = wasLiked
      ? await deleteRecipeLike(userId, recipeId)
      : await insertRecipeLike(userId, recipeId);

    if (error) {
      rollback();
    }
  };

  const toggleSaveRecipe = async (recipeId: string) => {
    if (!userId) return;

    const recipe = recipes.find((item) => item.id === recipeId);
    if (!recipe) return;

    if (recipe.is_saved) {
      const { error } = await deleteSavedRecipe(userId, recipeId);

      if (error) {
        toast({
          title: "Chyba",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Recept odstránený",
        description: "Recept bol odstránený z vašej zbierky.",
      });

      const patch = { is_saved: false };
      setRecipes((prev) => updateRecipeInList(prev, recipeId, patch));
      setSelectedRecipe((prev) => (prev && prev.id === recipeId ? { ...prev, ...patch } : prev));
      return;
    }

    const { error } = await insertSavedRecipe(userId, recipeId);

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Recept uložený",
      description: "Recept bol pridaný do vašej zbierky.",
    });

    const patch = { is_saved: true };
    setRecipes((prev) => updateRecipeInList(prev, recipeId, patch));
    setSelectedRecipe((prev) => (prev && prev.id === recipeId ? { ...prev, ...patch } : prev));
    onSaveSuccess?.();
  };

  return {
    toggleLike,
    toggleSaveRecipe,
  };
}
