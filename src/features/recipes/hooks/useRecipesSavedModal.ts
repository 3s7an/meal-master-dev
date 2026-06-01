import { useState } from "react";
import type { UserRecipe } from "@/types/recipe";

export function useRecipesSavedModal() {
  const [selectedSavedRecipe, setSelectedSavedRecipe] = useState<UserRecipe | null>(null);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);

  const openSaved = (recipe: UserRecipe) => {
    setSelectedSavedRecipe(recipe);
    setIsSavedModalOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setIsSavedModalOpen(open);
    if (!open) {
      setSelectedSavedRecipe(null);
    }
  };

  return {
    selectedSavedRecipe,
    setSelectedSavedRecipe,
    isSavedModalOpen,
    setIsSavedModalOpen,
    openSaved,
    handleOpenChange,
  };
}
