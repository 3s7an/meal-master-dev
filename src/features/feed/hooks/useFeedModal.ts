import { useState } from "react";
import type { FeedRecipe } from "@/types/recipe";

export function useFeedModal() {
  const [selectedRecipe, setSelectedRecipe] = useState<FeedRecipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openRecipe = (recipe: FeedRecipe) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  return {
    selectedRecipe,
    setSelectedRecipe,
    isModalOpen,
    setIsModalOpen,
    openRecipe,
  };
}
