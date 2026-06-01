import { useAuth } from "@/contexts/AuthContext";
import { useMealPlansData } from "./useMealPlansData";
import { useMealPlansEditorModal } from "./useMealPlansEditorModal";
import { useMealPlansMutations } from "./useMealPlansMutations";

export function useMealPlansPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const isAuthenticated = !!user;

  const { plans, loading, refetch } = useMealPlansData(userId);
  const editor = useMealPlansEditorModal();
  const { deletePlan, exportMealPlan, generateShoppingList } = useMealPlansMutations({
    userId,
    refetch,
  });

  return {
    plans,
    loading,
    isAuthenticated,
    isEditorModalOpen: editor.isEditorModalOpen,
    setIsEditorModalOpen: editor.setIsEditorModalOpen,
    selectedPlan: editor.selectedPlan,
    refetch,
    handleCreatePlan: editor.openNew,
    handleEditPlan: editor.openEdit,
    deletePlan,
    exportMealPlan,
    generateShoppingList,
  };
}
