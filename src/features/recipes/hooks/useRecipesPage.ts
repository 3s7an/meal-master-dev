import { useAuth } from "@/contexts/AuthContext";
import type { UserRecipe } from "@/types/recipe";
import { useRecipesData } from "./useRecipesData";
import { useRecipesEditorModal } from "./useRecipesEditorModal";
import { useRecipesFilters } from "./useRecipesFilters";
import { useRecipesMutations } from "./useRecipesMutations";
import { useRecipesSavedModal } from "./useRecipesSavedModal";

export function useRecipesPage() {
  const { user } = useAuth();
  const userId = user?.id;

  const { recipes, setRecipes, loading, refetch } = useRecipesData(userId);
  const filters = useRecipesFilters(recipes);
  const editor = useRecipesEditorModal();
  const saved = useRecipesSavedModal();

  const { toggleSave } = useRecipesMutations({
    userId,
    recipes,
    setRecipes,
    selectedSavedRecipe: saved.selectedSavedRecipe,
    setSelectedSavedRecipe: saved.setSelectedSavedRecipe,
    closeSavedModal: () => saved.setIsSavedModalOpen(false),
    refetch,
  });

  const handleRecipeClick = (recipe: UserRecipe) => {
    if (recipe.source === "saved") {
      saved.openSaved(recipe);
      return;
    }
    editor.openEdit(recipe);
  };

  return {
    filteredRecipes: filters.filteredRecipes,
    loading,
    searchTerm: filters.searchTerm,
    setSearchTerm: filters.setSearchTerm,
    selectedCategory: filters.selectedCategory,
    setSelectedCategory: filters.setSelectedCategory,
    isEditorModalOpen: editor.isEditorModalOpen,
    setIsEditorModalOpen: editor.setIsEditorModalOpen,
    selectedRecipe: editor.selectedRecipe,
    isSavedModalOpen: saved.isSavedModalOpen,
    selectedSavedRecipe: saved.selectedSavedRecipe,
    handleSavedModalOpenChange: saved.handleOpenChange,
    currentUserId: userId ?? null,
    refetch,
    toggleSave,
    handleRecipeClick,
    handleAddNew: editor.openNew,
  };
}
