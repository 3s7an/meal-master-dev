import { useFeedPage } from "@/features/feed/hooks/useFeedPage";
import { FeedBanner } from "@/features/feed/components/FeedBanner";
import { FeedCategoryFilter } from "@/features/feed/components/FeedCategoryFilter";
import { FeedRecipeModal } from "@/features/feed/components/FeedRecipeModal";
import { FeedRecipeGrid } from "@/features/feed/components/FeedRecipeGrid";
import { FeedSearch } from "@/features/feed/components/FeedSearch";

const Feed = () => {
  const {
    filteredRecipes,
    loading,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedRecipe,
    isDialogOpen,
    setIsDialogOpen,
    toggleLike,
    toggleSaveRecipe,
    handleRecipeClick,
    currentUserId,
  } = useFeedPage();

  return (
    <div className="space-y-8">
      <FeedBanner />

      <div className="flex flex-col gap-6">
        <FeedCategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        <FeedSearch searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />
      </div>

      <FeedRecipeGrid
        recipes={filteredRecipes}
        loading={loading}
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        currentUserId={currentUserId}
        onOpenRecipe={handleRecipeClick}
        onToggleLike={toggleLike}
      />

      <FeedRecipeModal
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        recipe={selectedRecipe}
        currentUserId={currentUserId}
        onToggleLike={toggleLike}
        onToggleSave={toggleSaveRecipe}
      />
    </div>
  );
};

export default Feed;
