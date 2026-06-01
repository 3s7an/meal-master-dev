import { useAuth } from "@/contexts/AuthContext";
import { useFeedData } from "./useFeedData";
import { useFeedDetailDialog } from "./useFeedModal";
import { useFeedFilters } from "./useFeedFilters";
import { useFeedMutations } from "./useFeedMutations";

export function useFeedPage() {
  const { user } = useAuth();
  const userId = user?.id;

  const { recipes, setRecipes, loading } = useFeedData(userId);
  const filters = useFeedFilters(recipes);
  const dialog = useFeedDetailDialog();

  const { toggleLike, toggleSaveRecipe } = useFeedMutations({
    userId,
    recipes,
    setRecipes,
    selectedRecipe: dialog.selectedRecipe,
    setSelectedRecipe: dialog.setSelectedRecipe,
    onSaveSuccess: () => dialog.setIsDialogOpen(false),
  });

  return {
    filteredRecipes: filters.filteredRecipes,
    loading,
    searchTerm: filters.searchTerm,
    setSearchTerm: filters.setSearchTerm,
    selectedCategory: filters.selectedCategory,
    setSelectedCategory: filters.setSelectedCategory,
    selectedRecipe: dialog.selectedRecipe,
    isDialogOpen: dialog.isDialogOpen,
    setIsDialogOpen: dialog.setIsDialogOpen,
    toggleLike,
    toggleSaveRecipe,
    handleRecipeClick: dialog.openRecipe,
    currentUserId: userId ?? null,
  };
}

export const useFeedRecipes = useFeedPage;
