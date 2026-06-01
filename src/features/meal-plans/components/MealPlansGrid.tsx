import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <Card className="text-center py-12">
        <CardContent>
          <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">Zatiaľ nemáte žiadne jedálničky</p>
          <Button onClick={onCreatePlan}>
            <Plus className="w-4 h-4 mr-2" />
            Vytvoriť jedálniček
          </Button>
        </CardContent>
      </Card>
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
    </div>
  );
}
