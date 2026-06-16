import { Calendar as CalendarIcon, Download, Edit, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="flex flex-col shadow-card hover:shadow-card-hover transition-all duration-300">
      <CardContent className="flex flex-col flex-1 p-5 gap-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-base leading-tight truncate">{plan.name}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {plan.plan_type === "weekly" ? "7 dní" : "30 dní"} · {plan.meals_per_day} jedlá/deň
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(plan.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarIcon className="w-4 h-4 shrink-0" />
          <span>Od {new Date(plan.start_date).toLocaleDateString("sk-SK")}</span>
        </div>

        <div className="flex flex-col gap-2 mt-auto">
          <div className="flex gap-2">
            <Button className="flex-1" variant="outline" size="sm" onClick={() => onExport(plan)}>
              <Download className="w-4 h-4 mr-1.5" />
              Export
            </Button>
            <Button className="flex-1" variant="outline" size="sm" onClick={() => onEdit(plan)}>
              <Edit className="w-4 h-4 mr-1.5" />
              Upraviť
            </Button>
          </div>
          <Button className="w-full" size="sm" onClick={() => onGenerateShoppingList(plan)}>
            <ShoppingCart className="w-4 h-4 mr-1.5" />
            Vytvoriť nákupný zoznam
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
