import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Clock, Users, BookmarkMinus, User } from "lucide-react";
import { format } from "date-fns";
import RecipeDialog from "@/components/RecipeDialog";
import { CATEGORY_OPTIONS, getCategoryOption, getCategoryImagePath } from "@/constants/categories";
import { useRecipes } from "@/hooks/useRecipes";

const Recipes = () => {
  const {
    filteredRecipes,
    loading,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    isDialogOpen,
    setIsDialogOpen,
    selectedRecipe,
    isSavedDialogOpen,
    selectedSavedRecipe,
    currentUserId,
    fetchRecipes,
    handleToggleSave,
    handleRecipeClick,
    handleAddNew,
    handleSavedDialogOpenChange,
  } = useRecipes();

  const categories = CATEGORY_OPTIONS;

  return (
    <div className="space-y-8">
      <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl group">
        <div className="relative h-64 md:h-80 lg:h-96">
          <img
            src="/images/section_masks/recepty_baner.png"
            alt="Moje recepty"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="absolute inset-0 flex items-center justify-between p-6 md:p-12 lg:p-16">
          <div className="max-w-2xl space-y-5 animate-in fade-in slide-in-from-left-5 duration-700">
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-2xl leading-tight">
                Moje recepty
              </h1>
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-20 bg-white rounded-full" />
                <div className="h-1.5 w-12 bg-white/70 rounded-full" />
              </div>
            </div>
            <p className="text-lg md:text-xl lg:text-2xl text-white/95 font-medium drop-shadow-lg max-w-xl leading-relaxed">
              Spravujte svoje obľúbené recepty
            </p>
          </div>
          <div className="hidden md:block">
            <Button onClick={handleAddNew} size="lg" className="gap-2 bg-background/90 hover:bg-background text-foreground shadow-lg">
              <Plus className="w-5 h-5" />
              Nový recept
            </Button>
          </div>
        </div>
      </div>

      <div className="md:hidden">
        <Button onClick={handleAddNew} size="lg" className="gap-2 w-full">
          <Plus className="w-5 h-5" />
          Nový recept
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex gap-4 flex-wrap items-center justify-center">
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex flex-col items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
          >
            <div
              className={`w-14 h-14 rounded-full overflow-hidden transition-all ${
                selectedCategory === null
                  ? "ring-2 ring-primary ring-offset-2 shadow-lg scale-110"
                  : "ring-1 ring-border/50 shadow-md hover:shadow-lg hover:ring-primary/50"
              }`}
            >
              <img
                src="/images/category_mini/feed_all.png"
                alt="Všetky"
                className="w-full h-full object-cover"
              />
            </div>
            <span
              className={`text-sm font-medium transition-all ${
                selectedCategory === null
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              Všetky
            </span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className="flex flex-col items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
            >
              <div
                className={`w-14 h-14 rounded-full overflow-hidden transition-all ${
                  selectedCategory === cat.value
                    ? "ring-2 ring-primary ring-offset-2 shadow-lg scale-110"
                    : "ring-1 ring-border/50 shadow-md hover:shadow-lg hover:ring-primary/50"
                }`}
              >
                <img
                  src={getCategoryImagePath(cat.value)}
                  alt={cat.label}
                  className="w-full h-full object-cover"
                />
              </div>
              <span
                className={`text-sm font-medium transition-all ${
                  selectedCategory === cat.value
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                {cat.label}
              </span>
            </button>
          ))}
        </div>

        <div className="relative max-w-md mx-auto w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Hľadať recepty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Načítavam recepty...</p>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="pt-6">
            {searchTerm || selectedCategory ? (
              <p className="text-muted-foreground mb-4">
                Nenašli sa žiadne recepty zodpovedajúce filtrom.
              </p>
            ) : (
              <>
                <p className="text-muted-foreground mb-4">
                  Začnite pridávaním svojich obľúbených receptov
                </p>
                <Button onClick={handleAddNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  Pridať prvý recept
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <Card
              key={recipe.id}
              className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col group border shadow-md hover:-translate-y-1"
              onClick={() => handleRecipeClick(recipe)}
            >
              <div className="flex flex-col p-5 gap-4 bg-card">
                <CardTitle className="font-bold text-xl leading-tight break-words line-clamp-2 group-hover:text-primary transition-colors">
                  {recipe.name}
                </CardTitle>

                <div className="relative w-full aspect-[9/7] overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10">
                  {recipe.image_url ? (
                    <img
                      src={recipe.image_url}
                      alt={recipe.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Users className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}

                  <div className="absolute top-3 left-3 z-10 flex gap-2">
                    {recipe.source === "saved" && (
                      <Badge variant="secondary" className="shadow-lg">Uložené</Badge>
                    )}
                    <Badge className="bg-primary text-primary-foreground whitespace-nowrap shadow-lg">
                      {getCategoryOption(recipe.category).label}
                    </Badge>
                  </div>
                </div>

                <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                  {recipe.description}
                </CardDescription>

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                  {recipe.calories && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-foreground">{recipe.calories}</span>
                      <span>kcal</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-foreground">{recipe.ingredients?.length || 0}</span>
                    <span>ingrediencií</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 mt-auto">
                  {recipe.created_at && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{format(new Date(recipe.created_at), "d.M.yyyy")}</span>
                    </div>
                  )}
                  {recipe.user_id && (
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span className="font-medium">
                        {recipe.user_id === currentUserId ? "Ja" : (recipe.author_name || "Neznámy autor")}
                      </span>
                    </div>
                  )}
                </div>

                {recipe.source === "saved" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-destructive mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSave(recipe.id);
                    }}
                  >
                    <BookmarkMinus className="w-4 h-4" />
                    Odobrať z uložených
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isSavedDialogOpen} onOpenChange={handleSavedDialogOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedSavedRecipe?.name}</DialogTitle>
            {selectedSavedRecipe && (
              <DialogDescription>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getCategoryOption(selectedSavedRecipe.category).badgeClass}>
                    {getCategoryOption(selectedSavedRecipe.category).label}
                  </Badge>
                  <Badge variant="secondary">Uložené</Badge>
                  {selectedSavedRecipe.user_id && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span>
                        {selectedSavedRecipe.user_id === currentUserId
                          ? "Ja"
                          : (selectedSavedRecipe.author_name || "Neznámy autor")}
                      </span>
                    </div>
                  )}
                  {selectedSavedRecipe.created_at && (
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(selectedSavedRecipe.created_at), "d.M.yyyy")}
                    </div>
                  )}
                </div>
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedSavedRecipe && (
            <div className="space-y-6">
              {selectedSavedRecipe.description && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground">Popis</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedSavedRecipe.description}
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Ingrediencie ({selectedSavedRecipe.ingredients?.length || 0})
                </h3>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {selectedSavedRecipe.ingredients?.map((ingredient: any, idx: number) => (
                    <li key={idx} className="text-sm">
                      {ingredient.name}
                      {ingredient.quantity && ingredient.quantity !== 1 ? ` - ${ingredient.quantity}` : ""}
                      {ingredient.unit ? ` ${ingredient.unit}` : ""}
                    </li>
                  ))}
                </ul>
              </div>

              {selectedSavedRecipe.instructions && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground">Postup prípravy</h3>
                  <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                    {selectedSavedRecipe.instructions}
                  </p>
                </div>
              )}

              {selectedSavedRecipe.calories && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground">Kalórie</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedSavedRecipe.calories} kcal
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  className="gap-2"
                  onClick={() => handleToggleSave(selectedSavedRecipe.id)}
                >
                  <BookmarkMinus className="w-4 h-4" />
                  Odobrať z uložených
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <RecipeDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        recipe={selectedRecipe}
        onSuccess={fetchRecipes}
      />
    </div>
  );
};

export default Recipes;
