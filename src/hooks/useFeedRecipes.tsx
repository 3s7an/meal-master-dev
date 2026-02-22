import { useState, useEffect } from "react";
import type { MouseEvent } from "react";
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
  user_id: string;
  created_at: string;
  likes_count?: number;
  is_liked?: boolean;
  is_saved?: boolean;
  author_name?: string | null;
}

export function useFeedRecipes() {
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
      const normalizedCategory = normalizeCategory(recipe.category);
      return {
        ...recipe,
        category: normalizedCategory,
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

  const toggleLike = async (recipeId: string, e: MouseEvent) => {
    e.stopPropagation();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    const wasLiked = recipe.is_liked;
    const newLikesCount = wasLiked
      ? (recipe.likes_count || 0) - 1
      : (recipe.likes_count || 0) + 1;

    setRecipes(prev => prev.map(r =>
      r.id === recipeId
        ? { ...r, is_liked: !wasLiked, likes_count: newLikesCount }
        : r
    ));
    setFilteredRecipes(prev => prev.map(r =>
      r.id === recipeId
        ? { ...r, is_liked: !wasLiked, likes_count: newLikesCount }
        : r
    ));

    if (selectedRecipe?.id === recipeId) {
      setSelectedRecipe(prev => prev ? {
        ...prev,
        is_liked: !wasLiked,
        likes_count: newLikesCount
      } : null);
    }

    if (wasLiked) {
      const { error } = await supabase
        .from("recipe_likes")
        .delete()
        .eq("recipe_id", recipeId)
        .eq("user_id", user.id);

      if (error) {
        setRecipes(prev => prev.map(r =>
          r.id === recipeId
            ? { ...r, is_liked: wasLiked, likes_count: recipe.likes_count || 0 }
            : r
        ));
        setFilteredRecipes(prev => prev.map(r =>
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
      }
    } else {
      const { error } = await supabase
        .from("recipe_likes")
        .insert({ recipe_id: recipeId, user_id: user.id });

      if (error) {
        setRecipes(prev => prev.map(r =>
          r.id === recipeId
            ? { ...r, is_liked: wasLiked, likes_count: recipe.likes_count || 0 }
            : r
        ));
        setFilteredRecipes(prev => prev.map(r =>
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
    currentUserId,
  };
}
