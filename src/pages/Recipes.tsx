import { useRecipesPage } from "@/features/recipes/hooks/useRecipesPage";
import { RecipeEditorModal } from "@/features/recipes/components/RecipeEditorModal";
import { RecipeSavedModal } from "@/features/recipes/components/RecipeSavedModal";
import { RecipesBanner } from "@/features/recipes/components/RecipesBanner";
import { RecipesCategoryFilter } from "@/features/recipes/components/RecipesCategoryFilter";
import { RecipesRecipeGrid } from "@/features/recipes/components/RecipesRecipeGrid";
import { RecipesSearch } from "@/features/recipes/components/RecipesSearch";

const Recipes = () => {
  const {
    filteredRecipes,
    loading,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    isEditorModalOpen,
    setIsEditorModalOpen,
    selectedRecipe,
    isSavedModalOpen,
    selectedSavedRecipe,
    currentUserId,
    refetch,
    toggleSave,
    handleRecipeClick,
    handleAddNew,
    handleSavedModalOpenChange,
  } = useRecipesPage();

  return (
    <div className="space-y-8">
      <RecipesBanner onAddNew={handleAddNew} />

      <div className="flex flex-col gap-6">
        <RecipesCategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        <RecipesSearch searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />
      </div>

      <RecipesRecipeGrid
        recipes={filteredRecipes}
        loading={loading}
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        currentUserId={currentUserId}
        onAddNew={handleAddNew}
        onOpenRecipe={handleRecipeClick}
        onToggleSave={toggleSave}
      />

      <RecipeSavedModal
        open={isSavedModalOpen}
        onOpenChange={handleSavedModalOpenChange}
        recipe={selectedSavedRecipe}
        currentUserId={currentUserId}
        onToggleSave={toggleSave}
      />

      <RecipeEditorModal
        open={isEditorModalOpen}
        onOpenChange={setIsEditorModalOpen}
        recipe={selectedRecipe}
        onSuccess={refetch}
      />
    </div>
  );
};

export default Recipes;
