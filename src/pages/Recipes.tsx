import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Clock, Users, BookmarkMinus, User } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import RecipeDialog from "@/components/RecipeDialog";
import { CATEGORY_OPTIONS, getCategoryOption, normalizeCategory, getCategoryImagePath } from "@/constants/categories";

interface Recipe {
  id: string;
  name: string;
  description: string;
  category: string;
  ingredients: any;
  instructions: string;
  image_url?: string;
  calories?: number;
  notes?: string;
  user_id?: string;
  is_public?: boolean;
  created_at?: string;
}

type RecipeSource = "own" | "saved";

type UserRecipe = Recipe & {
  source: RecipeSource;
  saved_at?: string;
  author_name?: string | null;
};

const Recipes = () => {
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<UserRecipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<UserRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isSavedDialogOpen, setIsSavedDialogOpen] = useState(false);
  const [selectedSavedRecipe, setSelectedSavedRecipe] = useState<UserRecipe | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const categories = CATEGORY_OPTIONS;

  useEffect(() => {
    fetchRecipes();
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [recipes, searchTerm, selectedCategory]);

  const fetchRecipes = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      setCurrentUserId(null);
      return;
    }

    setCurrentUserId(user.id);

    const [
      { data: ownData, error: ownError },
      { data: savedData, error: savedError },
    ] = await Promise.all([
      supabase
        .from("recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("saved_recipes")
        .select(`
          id, 
          created_at, 
          recipes(
            *,
            profiles:user_id (
              full_name
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (ownError || savedError) {
      toast({
        title: "Chyba",
        description: "Nepodarilo sa načítať recepty.",
        variant: "destructive",
      });
    } else {
      const ownRecipes: UserRecipe[] =
        (ownData || []).map((recipe) => ({
          ...recipe,
          category: normalizeCategory(recipe.category),
          source: "own" as const,
          author_name: null, // Vlastné recepty - zobrazíme "Ja"
        })) ?? [];

      const savedRecipes: UserRecipe[] =
        (savedData || [])
          .map((entry: any) => {
            if (!entry.recipes) return null;
            const recipe = entry.recipes;
            const authorName = recipe.profiles?.full_name || null;
            const normalizedCategory = normalizeCategory(recipe.category);
            return {
              ...recipe,
              category: normalizedCategory,
              source: "saved" as RecipeSource,
              saved_at: entry.created_at as string | undefined,
              author_name: authorName,
            } as UserRecipe;
          })
          .filter(Boolean) as UserRecipe[];

      const combinedMap = new Map<string, UserRecipe>();
      ownRecipes.forEach((recipe) => {
        combinedMap.set(recipe.id, recipe);
      });
      savedRecipes.forEach((recipe) => {
        if (combinedMap.has(recipe.id)) {
          const existing = combinedMap.get(recipe.id)!;
          combinedMap.set(recipe.id, {
            ...existing,
            saved_at: recipe.saved_at,
          });
        } else {
          combinedMap.set(recipe.id, recipe);
        }
      });

      const getSortValue = (recipe: UserRecipe) => {
        if (recipe.saved_at) {
          const savedTime = Date.parse(recipe.saved_at);
          if (!Number.isNaN(savedTime)) return savedTime;
        }
        if (recipe.created_at) {
          const createdTime = Date.parse(recipe.created_at);
          if (!Number.isNaN(createdTime)) return createdTime;
        }
        return 0;
      };

      const combined = Array.from(combinedMap.values()).sort(
        (a, b) => getSortValue(b) - getSortValue(a),
      );

      setRecipes(combined);
    }
    setLoading(false);
  };

  const filterRecipes = () => {
    let filtered = [...recipes];

    if (searchTerm) {
      filtered = filtered.filter((recipe) =>
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((recipe) => recipe.category === selectedCategory);
    }

    setFilteredRecipes(filtered);
  };

  const handleToggleSave = async (recipeId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return;

    if (recipe.source === "saved") {
      const { error } = await supabase
        .from("saved_recipes")
        .delete()
        .eq("recipe_id", recipeId)
        .eq("user_id", user.id);

      if (error) {
        toast({
          title: "Chyba",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Recept odstránený",
        description: "Recept bol odstránený z vašej zbierky.",
      });

      setRecipes((prev) =>
        prev.filter((item) => !(item.id === recipeId && item.source === "saved"))
      );
      setFilteredRecipes((prev) =>
        prev.filter((item) => !(item.id === recipeId && item.source === "saved"))
      );
      if (selectedSavedRecipe?.id === recipeId) {
        setSelectedSavedRecipe(null);
        setIsSavedDialogOpen(false);
      }
      return;
    }

    const { error } = await supabase
      .from("saved_recipes")
      .insert({ recipe_id: recipeId, user_id: user.id });

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Recept uložený",
      description: "Recept bol pridaný do vašej zbierky.",
    });

    await fetchRecipes();
  };

  const handleRecipeClick = (recipe: UserRecipe) => {
    if (recipe.source === "saved") {
      setSelectedSavedRecipe(recipe);
      setIsSavedDialogOpen(true);
      return;
    }
    setSelectedRecipe(recipe);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedRecipe(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Banner Section */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl group">
        {/* Background Image */}
        <div className="relative h-64 md:h-80 lg:h-96">
          <img
            src="/images/section_masks/recepty_baner.png"
            alt="Moje recepty"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50" />
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>
        
        {/* Content Overlay */}
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

      {/* Mobile Add Button */}
      <div className="md:hidden">
        <Button onClick={handleAddNew} size="lg" className="gap-2 w-full">
          <Plus className="w-5 h-5" />
          Nový recept
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {/* Categories - centered */}
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

        {/* Search bar - below categories */}
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
              {/* Content Section */}
              <div className="flex flex-col p-5 gap-4 bg-card">
                {/* Title at the top */}
                <CardTitle className="font-bold text-xl leading-tight break-words line-clamp-2 group-hover:text-primary transition-colors">
                  {recipe.name}
                </CardTitle>

                {/* Image Section with padding */}
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
                  
                  {/* Category Badge - positioned on image */}
                  <div className="absolute top-3 left-3 z-10 flex gap-2">
                    {recipe.source === "saved" && (
                      <Badge variant="secondary" className="shadow-lg">Uložené</Badge>
                    )}
                    {(() => {
                      const option = getCategoryOption(recipe.category);
                      return (
                        <Badge className="bg-primary text-primary-foreground whitespace-nowrap shadow-lg">
                          {option.label}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>

                {/* Description */}
                <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                  {recipe.description}
                </CardDescription>

                {/* Stats Section */}
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

                {/* Footer with Author and Date */}
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

                {/* Remove button for saved recipes */}
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

      <Dialog
        open={isSavedDialogOpen}
        onOpenChange={(open) => {
          setIsSavedDialogOpen(open);
          if (!open) {
            setSelectedSavedRecipe(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedSavedRecipe?.name}</DialogTitle>
            {selectedSavedRecipe && (
              <DialogDescription>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedSavedRecipe && (
                    <Badge className={getCategoryOption(selectedSavedRecipe.category).badgeClass}>
                      {getCategoryOption(selectedSavedRecipe.category).label}
                    </Badge>
                  )}
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