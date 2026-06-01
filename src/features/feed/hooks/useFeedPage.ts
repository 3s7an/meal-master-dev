import { useAuth } from "@/contexts/AuthContext";
import { useFeedData } from "./useFeedData";
import { useFeedModal } from "./useFeedModal";
import { useFeedFilters } from "./useFeedFilters";
import { useFeedMutations } from "./useFeedMutations";

export function useFeedPage() {
  const { user } = useAuth();
  const userId = user?.id;

  const { recipes, setRecipes, loading } = useFeedData(userId);
  const filters = useFeedFilters(recipes);
  const modal = useFeedModal();

  const { toggleLike, toggleSaveRecipe } = useFeedMutations({
    userId,
    recipes,
    setRecipes,
    selectedRecipe: modal.selectedRecipe,
    setSelectedRecipe: modal.setSelectedRecipe,
    onSaveSuccess: () => modal.setIsModalOpen(false),
  });

  return {
    filteredRecipes: filters.filteredRecipes,
    loading,
    searchTerm: filters.searchTerm,
    setSearchTerm: filters.setSearchTerm,
    selectedCategory: filters.selectedCategory,
    setSelectedCategory: filters.setSelectedCategory,
    selectedRecipe: modal.selectedRecipe,
    isModalOpen: modal.isModalOpen,
    setIsModalOpen: modal.setIsModalOpen,
    toggleLike,
    toggleSaveRecipe,
    handleRecipeClick: modal.openRecipe,
    currentUserId: userId ?? null,
  };
}

export const useFeedRecipes = useFeedPage;
