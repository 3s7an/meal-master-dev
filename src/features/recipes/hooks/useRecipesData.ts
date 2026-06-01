import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { UserRecipe } from "@/types/recipe";
import { getRecipesForUser } from "../services/recipesService";

export function useRecipesData(userId: string | undefined) {
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<UserRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecipes = useCallback(async () => {
    if (!userId) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { recipes: nextRecipes, error } = await getRecipesForUser(userId);

    if (error) {
      toast({
        title: "Chyba",
        description: "Nepodarilo sa načítať recepty.",
        variant: "destructive",
      });
      setRecipes([]);
    } else {
      setRecipes(nextRecipes);
    }

    setLoading(false);
  }, [userId, toast]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  return {
    recipes,
    setRecipes,
    loading,
    refetch: loadRecipes,
  };
}
