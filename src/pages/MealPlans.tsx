import { MealPlanEditorModal } from "@/features/meal-plans/components/MealPlanEditorModal";
import { MealPlansBanner } from "@/features/meal-plans/components/MealPlansBanner";
import { MealPlansGrid } from "@/features/meal-plans/components/MealPlansGrid";
import { useMealPlansPage } from "@/features/meal-plans/hooks/useMealPlansPage";

const MealPlans = () => {
  const {
    plans,
    loading,
    isAuthenticated,
    isEditorModalOpen,
    setIsEditorModalOpen,
    selectedPlan,
    refetch,
    handleCreatePlan,
    handleEditPlan,
    deletePlan,
    exportMealPlan,
    generateShoppingList,
  } = useMealPlansPage();

  return (
    <div className="space-y-8">
      <MealPlansBanner isAuthenticated={isAuthenticated} onCreatePlan={handleCreatePlan} />

      <MealPlansGrid
        plans={plans}
        loading={loading}
        isAuthenticated={isAuthenticated}
        onCreatePlan={handleCreatePlan}
        onEditPlan={handleEditPlan}
        onDeletePlan={deletePlan}
        onExportPlan={exportMealPlan}
        onGenerateShoppingList={generateShoppingList}
      />

      <MealPlanEditorModal
        open={isEditorModalOpen}
        onOpenChange={setIsEditorModalOpen}
        plan={selectedPlan}
        onSuccess={refetch}
      />
    </div>
  );
};

export default MealPlans;
