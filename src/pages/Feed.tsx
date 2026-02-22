import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Heart, Plus, Minus, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_OPTIONS, getCategoryOption, getCategoryImagePath } from "@/constants/categories";
import { useFeedRecipes } from "@/hooks/useFeedRecipes";

const Feed = () => {
  const {
    filteredRecipes,
    loading,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    selectedRecipe,
    isDialogOpen,
    setIsDialogOpen,
    toggleLike,
    toggleSaveRecipe,
    handleRecipeClick,
    currentUserId,
  } = useFeedRecipes();

  const categories = CATEGORY_OPTIONS;

  return (
    <div className="space-y-8">
      {/* Banner Section */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl group">
        <div className="relative h-64 md:h-80 lg:h-96">
          <img
            src="/images/section_masks/feed_baner.png"
            alt="Feed receptov"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="absolute inset-0 flex items-center justify-start p-6 md:p-12 lg:p-16">
          <div className="max-w-2xl space-y-5 animate-in fade-in slide-in-from-left-5 duration-700">
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-2xl leading-tight">
                Feed receptov
              </h1>
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-20 bg-white rounded-full" />
                <div className="h-1.5 w-12 bg-white/70 rounded-full" />
              </div>
            </div>
            <p className="text-lg md:text-xl lg:text-2xl text-white/95 font-medium drop-shadow-lg max-w-xl leading-relaxed">
              Objavujte recepty od iných používateľov
            </p>
          </div>
        </div>
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
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedCategory
                ? "Nenašli sa žiadne recepty zodpovedajúce filtrom."
                : "Zatiaľ nie sú žiadne verejné recepty."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <Card
              key={recipe.id}
              className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col group border-0 shadow-lg hover:-translate-y-1 bg-gradient-to-br from-background/80 via-primary/5 to-background/60 backdrop-blur-sm"
              onClick={() => handleRecipeClick(recipe)}
            >
              <div className="flex flex-col p-5 gap-4 bg-transparent relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-lg opacity-50" />
                <div className="relative z-10">
                  <CardTitle className="font-bold text-xl leading-tight break-words line-clamp-2 group-hover:text-primary transition-colors mb-6">
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
                        <Clock className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}

                    <div className="absolute top-3 left-3 z-10">
                      <Badge className="bg-primary text-primary-foreground whitespace-nowrap shadow-lg">
                        {getCategoryOption(recipe.category).label}
                      </Badge>
                    </div>

                    <div className="absolute top-3 right-3 z-10">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`gap-1 bg-background/90 hover:bg-background shadow-lg ${recipe.is_liked ? "text-red-500" : "text-foreground"}`}
                        onClick={(e) => toggleLike(recipe.id, e)}
                      >
                        <Heart className={`w-4 h-4 ${recipe.is_liked ? "fill-current" : ""}`} />
                        <span>{recipe.likes_count || 0}</span>
                      </Button>
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
                    {recipe.author_name && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="font-medium">
                          {recipe.user_id === currentUserId ? "Ja" : recipe.author_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] md:w-full max-w-[95vw] md:max-w-2xl overflow-x-hidden">
          <DialogHeader className="w-full max-w-full">
            <DialogTitle className="break-words">{selectedRecipe?.name}</DialogTitle>
            <DialogDescription>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedRecipe && (
                  <Badge className={getCategoryOption(selectedRecipe.category).badgeClass}>
                    {getCategoryOption(selectedRecipe.category).label}
                  </Badge>
                )}
                {selectedRecipe?.author_name && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span>
                      {selectedRecipe.user_id === currentUserId ? "Ja" : selectedRecipe.author_name}
                    </span>
                  </div>
                )}
                {selectedRecipe?.created_at && (
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(selectedRecipe.created_at), "d.M.yyyy")}
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          {selectedRecipe && (
            <div className="space-y-6 w-full max-w-full overflow-x-hidden">
              {selectedRecipe.image_url && (
                <div className="relative w-full aspect-[4/3] md:aspect-[3/2] overflow-hidden rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
                  <img
                    src={selectedRecipe.image_url}
                    alt={selectedRecipe.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="w-full max-w-full">
                <Label>Popis</Label>
                <p className="text-sm text-muted-foreground mt-1 break-words">{selectedRecipe.description}</p>
              </div>

              <div className="w-full max-w-full">
                <Label>Ingrediencie ({selectedRecipe.ingredients?.length || 0})</Label>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {selectedRecipe.ingredients?.map((ing: any, idx: number) => (
                    <li key={idx} className="text-sm break-words">
                      {ing.name}
                      {ing.quantity && ing.quantity !== 1 ? ` - ${ing.quantity}` : ""}
                      {ing.unit ? ` ${ing.unit}` : ""}
                    </li>
                  ))}
                </ul>
              </div>

              {selectedRecipe.instructions && (
                <div className="w-full max-w-full">
                  <Label>Postup prípravy</Label>
                  <Textarea
                    value={selectedRecipe.instructions}
                    readOnly
                    className="mt-2 min-h-[120px] w-full max-w-full resize-none"
                  />
                </div>
              )}

              {selectedRecipe.calories && (
                <div>
                  <Label>Kalórie</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedRecipe.calories} kcal</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-4 w-full max-w-full">
                <Button
                  variant="outline"
                  className="gap-2 w-full sm:w-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(selectedRecipe.id, e);
                  }}
                >
                  <Heart className={`w-4 h-4 ${selectedRecipe.is_liked ? "fill-current text-red-500" : ""}`} />
                  {selectedRecipe.is_liked ? "Odobrať lajk" : "Lajkovať"}
                  <span className="text-muted-foreground">({selectedRecipe.likes_count || 0})</span>
                </Button>
                {selectedRecipe.user_id !== currentUserId && (
                  <Button
                    onClick={() => toggleSaveRecipe(selectedRecipe.id)}
                    className="gap-2 w-full sm:w-auto"
                    variant={selectedRecipe.is_saved ? "destructive" : "default"}
                  >
                    {selectedRecipe.is_saved ? (
                      <Minus className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">
                      {selectedRecipe.is_saved ? "Odobrať z mojich receptov" : "Pridať do mojich receptov"}
                    </span>
                    <span className="sm:hidden">
                      {selectedRecipe.is_saved ? "Odobrať" : "Pridať"}
                    </span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Feed;
