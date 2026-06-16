import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { MealPlan } from "@/types/mealPlan";
import { MealPlanCard } from "./MealPlanCard";

interface MealPlansGridProps {
  plans: MealPlan[];
  loading: boolean;
  isAuthenticated: boolean;
  onCreatePlan: () => void;
  onEditPlan: (plan: MealPlan) => void;
  onDeletePlan: (planId: string) => void;
  onExportPlan: (plan: MealPlan) => void;
  onGenerateShoppingList: (plan: MealPlan) => void;
}

function AddPlanCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors duration-200 min-h-[180px] p-6 w-full"
    >
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
        <Plus className="w-5 h-5" />
      </div>
      <span className="text-sm font-medium">Pridať jedálniček</span>
    </button>
  );
}

export function MealPlansGrid({
  plans,
  loading,
  isAuthenticated,
  onCreatePlan,
  onEditPlan,
  onDeletePlan,
  onExportPlan,
  onGenerateShoppingList,
}: MealPlansGridProps) {
  if (!isAuthenticated) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-muted-foreground">
            Musíte byť prihlásený, aby ste mohli zobraziť jedálničky.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Načítavam jedálničky...</p>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="text-center py-12 md:col-span-2 lg:col-span-3">
          <CardContent>
            <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Zatiaľ nemáte žiadne jedálničky</p>
            <AddPlanCard onClick={onCreatePlan} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <MealPlanCard
          key={plan.id}
          plan={plan}
          onEdit={onEditPlan}
          onDelete={onDeletePlan}
          onExport={onExportPlan}
          onGenerateShoppingList={onGenerateShoppingList}
        />
      ))}
      <AddPlanCard onClick={onCreatePlan} />
    </div>
  );
}
