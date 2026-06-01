import { useToast } from "@/hooks/use-toast";
import { deleteMealPlan } from "../api/mealPlansRepository";
import { exportSavedMealPlanPdf } from "../services/mealPlanExportService";
import { generateShoppingListFromPlan } from "../services/mealPlanShoppingListService";
import type { MealPlan } from "@/types/mealPlan";

interface UseMealPlansMutationsOptions {
  userId: string | undefined;
  refetch: () => Promise<void>;
}

export function useMealPlansMutations({ userId, refetch }: UseMealPlansMutationsOptions) {
  const { toast } = useToast();

  const deletePlan = async (planId: string) => {
    if (!userId) return;

    const { error } = await deleteMealPlan(planId, userId);

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Plán odstránený",
      description: "Jedálniček bol odstránený.",
    });
    await refetch();
  };

  const exportMealPlan = async (plan: MealPlan) => {
    try {
      await exportSavedMealPlanPdf(plan);
      toast({
        title: "Export hotovy",
        description: "Jedalnicek bol exportovany do PDF.",
      });
    } catch (error) {
      console.error("Error creating PDF:", error);
      toast({
        title: "Chyba",
        description: "Nepodarilo sa vytvoriť PDF súbor.",
        variant: "destructive",
      });
    }
  };

  const generateShoppingList = async (plan: MealPlan) => {
    if (!userId) {
      toast({
        title: "Chyba",
        description: "Musíte byť prihlásený.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await generateShoppingListFromPlan(userId, plan);

      if (result.warning === "no_recipes") {
        toast({
          title: "Upozornenie",
          description: "Jedálny plán neobsahuje žiadne recepty.",
          variant: "destructive",
        });
        return;
      }

      if (result.warning === "no_ingredients") {
        toast({
          title: "Upozornenie",
          description: "Recepty v pláne nemajú žiadne ingrediencie.",
          variant: "destructive",
        });
        return;
      }

      if (result.error) {
        toast({
          title: "Chyba",
          description: result.error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Nákupný zoznam vytvorený",
        description: `Bolo pridaných ${result.itemCount} položiek do nákupného zoznamu.`,
      });
    } catch (error) {
      console.error("Error generating shopping list:", error);
      toast({
        title: "Chyba",
        description: "Nepodarilo sa vytvoriť nákupný zoznam.",
        variant: "destructive",
      });
    }
  };

  return {
    deletePlan,
    exportMealPlan,
    generateShoppingList,
  };
}
