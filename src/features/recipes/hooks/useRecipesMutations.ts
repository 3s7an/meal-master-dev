import type { Dispatch, SetStateAction } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  deleteSavedRecipe,
  insertSavedRecipe,
} from "@/shared/api/savedRecipesRepository";
import type { UserRecipe } from "@/types/recipe";

interface UseRecipesMutationsOptions {
  userId: string | undefined;
  recipes: UserRecipe[];
  setRecipes: Dispatch<SetStateAction<UserRecipe[]>>;
  selectedSavedRecipe: UserRecipe | null;
  setSelectedSavedRecipe: Dispatch<SetStateAction<UserRecipe | null>>;
  closeSavedModal: () => void;
  refetch: () => Promise<void>;
}

export function useRecipesMutations({
  userId,
  recipes,
  setRecipes,
  selectedSavedRecipe,
  setSelectedSavedRecipe,
  closeSavedModal,
  refetch,
}: UseRecipesMutationsOptions) {
  const { toast } = useToast();

  const toggleSave = async (recipeId: string) => {
    if (!userId) return;

    const recipe = recipes.find((item) => item.id === recipeId);
    if (!recipe) return;

    if (recipe.source === "saved") {
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

      setRecipes((prev) =>
        prev.filter((item) => !(item.id === recipeId && item.source === "saved")),
      );

      if (selectedSavedRecipe?.id === recipeId) {
        setSelectedSavedRecipe(null);
        closeSavedModal();
      }
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

    await refetch();
  };

  return { toggleSave };
}
