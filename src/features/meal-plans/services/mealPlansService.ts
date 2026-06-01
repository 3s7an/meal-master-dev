import { fetchMealPlans } from "../api/mealPlansRepository";
import type { MealPlan } from "@/types/mealPlan";

export async function getMealPlansForUser(userId: string) {
  const { data, error } = await fetchMealPlans(userId);

  return {
    plans: (data ?? []) as MealPlan[],
    error,
  };
}
