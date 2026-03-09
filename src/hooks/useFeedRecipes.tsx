import { useState, useEffect, useMemo, useCallback } from "react";
import type { MouseEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { normalizeCategory } from "@/constants/categories";
import { useAuth } from "@/contexts/AuthContext";
import type { FeedRecipe } from "@/types/recipe";

export type { FeedRecipe as Recipe };

export function useFeedRecipes() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<FeedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  const [selectedRecipe, setSelectedRecipe] = useState<FeedRecipe | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchRecipes = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data: recipesData, error: recipesError } = await supabase
      .from("recipes")
      .select(`
        *,
        profiles:user_id (
          full_name
        )
      `)
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (recipesError) {
      toast({
        title: "Chyba",
        description: "Nepodarilo sa načítať recepty.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { data: likesData } = await supabase
      .from("recipe_likes")
      .select("recipe_id, user_id");

    const { data: savedData } = await supabase
      .from("saved_recipes")
      .select("recipe_id")
      .eq("user_id", user.id);

    const recipesWithStats = recipesData?.map((recipe: any) => {
      const recipeLikes = likesData?.filter(like => like.recipe_id === recipe.id) || [];
      const authorName = recipe.profiles?.full_name || null;
      return {
        ...recipe,
        category: normalizeCategory(recipe.category),
        author_name: authorName,
        likes_count: recipeLikes.length,
        is_liked: recipeLikes.some(like => like.user_id === user.id),
        is_saved: savedData?.some(saved => saved.recipe_id === recipe.id) || false,
      };
    }) || [];

    if (sortBy === "popular") {
      recipesWithStats.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    }

    setRecipes(recipesWithStats);
    setLoading(false);
  }, [user, sortBy, toast]);

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

  const toggleLike = async (recipeId: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    const wasLiked = recipe.is_liked;
    const newLikesCount = wasLiked
      ? (recipe.likes_count || 0) - 1
      : (recipe.likes_count || 0) + 1;

    const optimisticUpdate = (list: FeedRecipe[]) =>
      list.map(r =>
        r.id === recipeId
          ? { ...r, is_liked: !wasLiked, likes_count: newLikesCount }
          : r
      );

    setRecipes(optimisticUpdate);

    if (selectedRecipe?.id === recipeId) {
      setSelectedRecipe(prev => prev ? {
        ...prev,
        is_liked: !wasLiked,
        likes_count: newLikesCount
      } : null);
    }

    const rollback = () => {
      setRecipes(prev => prev.map(r =>
        r.id === recipeId
          ? { ...r, is_liked: wasLiked, likes_count: recipe.likes_count || 0 }
          : r
      ));
      if (selectedRecipe?.id === recipeId) {
        setSelectedRecipe(prev => prev ? {
          ...prev,
          is_liked: wasLiked,
          likes_count: recipe.likes_count || 0
        } : null);
      }
    };

    if (wasLiked) {
      const { error } = await supabase
        .from("recipe_likes")
        .delete()
        .eq("recipe_id", recipeId)
        .eq("user_id", user.id);

      if (error) rollback();
    } else {
      const { error } = await supabase
        .from("recipe_likes")
        .insert({ recipe_id: recipeId, user_id: user.id });

      if (error) rollback();
    }
  };

  const toggleSaveRecipe = async (recipeId: string) => {
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

  const handleRecipeClick = (recipe: FeedRecipe) => {
    setSelectedRecipe(recipe);
    setIsDialogOpen(true);
  };

  return {
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
    currentUserId: user?.id ?? null,
  };
}
