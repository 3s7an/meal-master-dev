import { useState } from "react";
import type { FeedRecipe } from "@/types/recipe";

export function useFeedDetailDialog() {
  const [selectedRecipe, setSelectedRecipe] = useState<FeedRecipe | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openRecipe = (recipe: FeedRecipe) => {
    setSelectedRecipe(recipe);
    setIsDialogOpen(true);
  };

  return {
    selectedRecipe,
    setSelectedRecipe,
    isDialogOpen,
    setIsDialogOpen,
    openRecipe,
  };
}
