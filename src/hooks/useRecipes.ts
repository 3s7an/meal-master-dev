import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { normalizeCategory } from "@/constants/categories";

export interface Recipe {
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

export type RecipeSource = "own" | "saved";

export interface UserRecipe extends Recipe {
  source: RecipeSource;
  saved_at?: string;
  author_name?: string | null;
}

export function useRecipes() {
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
          author_name: null,
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

  const handleSavedDialogOpenChange = (open: boolean) => {
    setIsSavedDialogOpen(open);
    if (!open) {
      setSelectedSavedRecipe(null);
    }
  };

  return {
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
  };
}
