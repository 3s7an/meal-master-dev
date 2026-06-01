import { Calendar as CalendarIcon, Download, Edit, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MealPlan } from "@/types/mealPlan";

interface MealPlanCardProps {
  plan: MealPlan;
  onEdit: (plan: MealPlan) => void;
  onDelete: (planId: string) => void;
  onExport: (plan: MealPlan) => void;
  onGenerateShoppingList: (plan: MealPlan) => void;
}

export function MealPlanCard({
  plan,
  onEdit,
  onDelete,
  onExport,
  onGenerateShoppingList,
}: MealPlanCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>
              {plan.plan_type === "weekly" ? "7 dní" : "30 dní"} • {plan.meals_per_day} jedlá/deň
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onDelete(plan.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <CalendarIcon className="w-4 h-4" />
          <span>Od {new Date(plan.start_date).toLocaleDateString("sk-SK")}</span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button className="flex-1" variant="outline" onClick={() => onExport(plan)}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button className="flex-1" variant="outline" onClick={() => onEdit(plan)}>
              <Edit className="w-4 h-4 mr-2" />
              Upraviť
            </Button>
          </div>
          <Button className="w-full" variant="default" onClick={() => onGenerateShoppingList(plan)}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Vytvoriť nákupný zoznam
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
