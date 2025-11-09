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
import { CATEGORY_OPTIONS, getCategoryOption, normalizeCategory } from "@/constants/categories";

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Moje recepty</h1>
          <p className="text-muted-foreground">Spravujte svoje obľúbené recepty</p>
        </div>
        <Button onClick={handleAddNew} size="lg" className="gap-2">
          <Plus className="w-5 h-5" />
          Nový recept
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Hľadať recepty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
          >
            Všetky
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.value}
              variant={selectedCategory === cat.value ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat.value)}
            >
              {cat.label}
            </Button>
          ))}
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
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleRecipeClick(recipe)}
            >
              <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                {recipe.image_url ? (
                  <img
                    src={recipe.image_url}
                    alt={recipe.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="w-16 h-16 text-muted-foreground" />
                )}
              </div>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-1">{recipe.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      {recipe.source === "saved" && (
                        <Badge variant="secondary">Uložené</Badge>
                      )}
                      {(() => {
                        const option = getCategoryOption(recipe.category);
                        return (
                          <Badge className={option.badgeClass}>
                            {option.label}
                          </Badge>
                        );
                      })()}
                    </div>
                </div>
                <CardDescription className="line-clamp-2">
                  {recipe.description}
                </CardDescription>
                <div className="flex flex-col gap-1 mt-2">
                  {recipe.user_id && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span>
                        {recipe.user_id === currentUserId ? "Ja" : (recipe.author_name || "Neznámy autor")}
                      </span>
                    </div>
                  )}
                  {recipe.created_at && (
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(recipe.created_at), "d.M.yyyy")}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{recipe.ingredients?.length || 0} ingrediencií</span>
                    </div>
                    {recipe.calories && (
                      <div className="flex items-center gap-1">
                        <span>{recipe.calories} kcal</span>
                      </div>
                    )}
                  </div>
                  {recipe.source === "saved" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSave(recipe.id);
                      }}
                    >
                      <BookmarkMinus className="w-4 h-4" />
                      Odobrať
                    </Button>
                  )}
                </div>
              </CardContent>
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