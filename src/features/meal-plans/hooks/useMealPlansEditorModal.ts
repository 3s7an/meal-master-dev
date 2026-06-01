import { useState } from "react";
import type { MealPlan } from "@/types/mealPlan";

export function useMealPlansEditorModal() {
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);

  const openNew = () => {
    setSelectedPlan(null);
    setIsEditorModalOpen(true);
  };

  const openEdit = (plan: MealPlan) => {
    setSelectedPlan(plan);
    setIsEditorModalOpen(true);
  };

  return {
    selectedPlan,
    setSelectedPlan,
    isEditorModalOpen,
    setIsEditorModalOpen,
    openNew,
    openEdit,
  };
}
