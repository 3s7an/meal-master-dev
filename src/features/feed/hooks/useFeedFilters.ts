import { useMemo, useState } from "react";
import type { FeedRecipe } from "@/types/recipe";

export function useFeedFilters(recipes: FeedRecipe[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredRecipes = useMemo(() => {
    let filtered = recipes;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((recipe) => recipe.name.toLowerCase().includes(term));
    }

    if (selectedCategory) {
      filtered = filtered.filter((recipe) => recipe.category === selectedCategory);
    }

    return filtered;
  }, [recipes, searchTerm, selectedCategory]);

  return {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    filteredRecipes,
  };
}
