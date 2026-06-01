import { useState } from "react";
import type { Recipe } from "@/types/recipe";

export function useRecipesEditorModal() {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);

  const openNew = () => {
    setSelectedRecipe(null);
    setIsEditorModalOpen(true);
  };

  const openEdit = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsEditorModalOpen(true);
  };

  return {
    selectedRecipe,
    setSelectedRecipe,
    isEditorModalOpen,
    setIsEditorModalOpen,
    openNew,
    openEdit,
  };
}
