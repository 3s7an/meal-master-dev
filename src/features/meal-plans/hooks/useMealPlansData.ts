import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { MealPlan } from "@/types/mealPlan";
import { getMealPlansForUser } from "../services/mealPlansService";

export function useMealPlansData(userId: string | undefined) {
  const { toast } = useToast();
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPlans = useCallback(async () => {
    if (!userId) {
      setPlans([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { plans: nextPlans, error } = await getMealPlansForUser(userId);

    if (error) {
      toast({
        title: "Chyba",
        description: "Nepodarilo sa načítať jedálničky.",
        variant: "destructive",
      });
      setPlans([]);
    } else {
      setPlans(nextPlans);
    }

    setLoading(false);
  }, [userId, toast]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  return {
    plans,
    loading,
    refetch: loadPlans,
  };
}
