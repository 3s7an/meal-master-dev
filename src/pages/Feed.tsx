import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Heart, Plus, Minus, TrendingUp, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Recipe {
  id: string;
  name: string;
  description: string;
  category: string;
  ingredients: any;
  instructions: string;
  image_url?: string;
  calories?: number;
  user_id: string;
  created_at: string;
  likes_count?: number;
  is_liked?: boolean;
  is_saved?: boolean;
  author_name?: string | null;
}

const Feed = () => {
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const categories = [
    { value: "breakfast", label: "Raňajky", color: "bg-accent" },
    { value: "lunch", label: "Obed", color: "bg-primary" },
    { value: "dinner", label: "Večera", color: "bg-secondary" },
    { value: "snack", label: "Snack", color: "bg-muted" },
  ];

  useEffect(() => {
    fetchRecipes();
  }, [sortBy]);

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

    // Fetch public recipes with author information
    const { data: recipesData, error: recipesError } = await supabase
      .from("recipes")
      .select(`
        *,
        profiles:user_id (
          full_name
        )
      `)
      .eq("is_public", true)
      .order(sortBy === "recent" ? "created_at" : "created_at", { ascending: false });

    if (recipesError) {
      toast({
        title: "Chyba",
        description: "Nepodarilo sa načítať recepty.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Fetch likes
    const { data: likesData } = await supabase
      .from("recipe_likes")
      .select("recipe_id, user_id");

    // Fetch saved recipes
    const { data: savedData } = await supabase
      .from("saved_recipes")
      .select("recipe_id")
      .eq("user_id", user.id);

    // Calculate likes count and user's interactions
    const recipesWithStats = recipesData?.map((recipe: any) => {
      const recipeLikes = likesData?.filter(like => like.recipe_id === recipe.id) || [];
      const authorName = recipe.profiles?.full_name || null;
      return {
        ...recipe,
        author_name: authorName,
        likes_count: recipeLikes.length,
        is_liked: recipeLikes.some(like => like.user_id === user.id),
        is_saved: savedData?.some(saved => saved.recipe_id === recipe.id) || false,
      };
    }) || [];

    // Sort by popularity if needed
    if (sortBy === "popular") {
      recipesWithStats.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    }

    setRecipes(recipesWithStats);
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

  const toggleLike = async (recipeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    if (recipe.is_liked) {
      const { error } = await supabase
        .from("recipe_likes")
        .delete()
        .eq("recipe_id", recipeId)
        .eq("user_id", user.id);

      if (!error) {
        fetchRecipes();
      }
    } else {
      const { error } = await supabase
        .from("recipe_likes")
        .insert({ recipe_id: recipeId, user_id: user.id });

      if (!error) {
        fetchRecipes();
      }
    }
  };

  const toggleSaveRecipe = async (recipeId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    if (recipe.is_saved) {
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

      setRecipes(prev =>
        prev.map(r =>
          r.id === recipeId ? { ...r, is_saved: false } : r
        )
      );
      setSelectedRecipe(prev =>
        prev && prev.id === recipeId ? { ...prev, is_saved: false } : prev
      );

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
    } else {
      toast({
        title: "Recept uložený",
        description: "Recept bol pridaný do vašej zbierky.",
      });
      setRecipes(prev =>
        prev.map(r =>
          r.id === recipeId ? { ...r, is_saved: true } : r
        )
      );
      setSelectedRecipe(prev =>
        prev && prev.id === recipeId ? { ...prev, is_saved: true } : prev
      );
      setIsDialogOpen(false);
    }
  };

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Feed receptov</h1>
          <p className="text-muted-foreground">Objavujte recepty od iných používateľov</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
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
          <div className="flex gap-2">
            <Button
              variant={sortBy === "recent" ? "default" : "outline"}
              onClick={() => setSortBy("recent")}
              className="gap-2"
            >
              <Clock className="w-4 h-4" />
              Najnovšie
            </Button>
            <Button
              variant={sortBy === "popular" ? "default" : "outline"}
              onClick={() => setSortBy("popular")}
              className="gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Najobľúbenejšie
            </Button>
          </div>
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
                  <Clock className="w-16 h-16 text-muted-foreground" />
                )}
              </div>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-1">{recipe.name}</CardTitle>
                  <Badge
                    className={
                      categories.find((c) => c.value === recipe.category)?.color
                    }
                  >
                    {categories.find((c) => c.value === recipe.category)?.label}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {recipe.description}
                </CardDescription>
                <div className="flex flex-col gap-1 mt-2">
                  {recipe.author_name && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span>
                        {recipe.user_id === currentUserId ? "Ja" : recipe.author_name}
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
                    <span>{recipe.ingredients?.length || 0} ingrediencií</span>
                    {recipe.calories && <span>{recipe.calories} kcal</span>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-1 ${recipe.is_liked ? "text-red-500" : ""}`}
                    onClick={(e) => toggleLike(recipe.id, e)}
                  >
                    <Heart className={`w-4 h-4 ${recipe.is_liked ? "fill-current" : ""}`} />
                    <span>{recipe.likes_count || 0}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRecipe?.name}</DialogTitle>
            <DialogDescription>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={categories.find(c => c.value === selectedRecipe?.category)?.color}>
                  {categories.find(c => c.value === selectedRecipe?.category)?.label}
                </Badge>
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
            <div className="space-y-6">
              <div>
                <Label>Popis</Label>
                <p className="text-sm text-muted-foreground mt-1">{selectedRecipe.description}</p>
              </div>

              <div>
                <Label>Ingrediencie ({selectedRecipe.ingredients?.length || 0})</Label>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {selectedRecipe.ingredients?.map((ing: any, idx: number) => (
                    <li key={idx} className="text-sm">
                      {ing.name}
                      {ing.quantity && ing.quantity !== 1 ? ` - ${ing.quantity}` : ""}
                      {ing.unit ? ` ${ing.unit}` : ""}
                    </li>
                  ))}
                </ul>
              </div>

              {selectedRecipe.instructions && (
                <div>
                  <Label>Postup prípravy</Label>
                  <Textarea
                    value={selectedRecipe.instructions}
                    readOnly
                    className="mt-2 min-h-[120px]"
                  />
                </div>
              )}

              {selectedRecipe.calories && (
                <div>
                  <Label>Kalórie</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedRecipe.calories} kcal</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(selectedRecipe.id, e as any);
                  }}
                >
                  <Heart className={`w-4 h-4 ${selectedRecipe.is_liked ? "fill-current text-red-500" : ""}`} />
                  {selectedRecipe.is_liked ? "Odobrať lajk" : "Lajkovať"}
                  <span className="text-muted-foreground">({selectedRecipe.likes_count || 0})</span>
                </Button>
                {selectedRecipe.user_id !== currentUserId && (
                  <Button
                    onClick={() => toggleSaveRecipe(selectedRecipe.id)}
                    className="gap-2"
                    variant={selectedRecipe.is_saved ? "destructive" : "default"}
                  >
                    {selectedRecipe.is_saved ? (
                      <Minus className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {selectedRecipe.is_saved ? "Odobrať z mojich receptov" : "Pridať do mojich receptov"}
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
