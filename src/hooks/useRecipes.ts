import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { normalizeCategory } from "@/constants/categories";
import { useAuth } from "@/contexts/AuthContext";
import type { Recipe, UserRecipe, RecipeSource } from "@/types/recipe";

export type { Recipe, UserRecipe, RecipeSource };

export function useRecipes() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<UserRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isSavedDialogOpen, setIsSavedDialogOpen] = useState(false);
  const [selectedSavedRecipe, setSelectedSavedRecipe] = useState<UserRecipe | null>(null);

  const fetchRecipes = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

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
            return {
              ...recipe,
              category: normalizeCategory(recipe.category),
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
  }, [user, toast]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const filteredRecipes = useMemo(() => {
    let filtered = recipes;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((recipe) =>
        recipe.name.toLowerCase().includes(term)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((recipe) => recipe.category === selectedCategory);
    }

    return filtered;
  }, [recipes, searchTerm, selectedCategory]);

  const handleToggleSave = async (recipeId: string) => {
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
    currentUserId: user?.id ?? null,
    fetchRecipes,
    handleToggleSave,
    handleRecipeClick,
    handleAddNew,
    handleSavedDialogOpenChange,
  };
}
