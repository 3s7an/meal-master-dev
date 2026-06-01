import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { FeedRecipe } from "@/types/recipe";
import { getFeedForUser, type FeedSortBy } from "../services/feedService";

export function useFeedData(userId: string | undefined, sortBy: FeedSortBy = "recent") {
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<FeedRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = useCallback(async () => {
    if (!userId) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { recipes: nextRecipes, error } = await getFeedForUser(userId, sortBy);

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
  }, [userId, sortBy, toast]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  return {
    recipes,
    setRecipes,
    loading,
    refetch: loadFeed,
  };
}
