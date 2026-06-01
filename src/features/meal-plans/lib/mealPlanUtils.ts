import { MEAL_TYPE_OPTIONS } from "./mealPlanConstants";
import type { MealPlanData } from "@/types/mealPlan";

export const normalizeMealType = (id: string) => {
  if (id === "desiata" || id === "dezert") {
    return "snack";
  }
  return id;
};

export const normalizeMealTypes = (types: string[] = []) => {
  const normalized = types.map(normalizeMealType);
  return Array.from(new Set(normalized)).filter((type) =>
    MEAL_TYPE_OPTIONS.some((option) => option.id === type),
  );
};

export const migratePlanDataKeys = (data: MealPlanData = {}) => {
  const result: Record<string, unknown> = {};

  Object.entries(data).forEach(([key, value]) => {
    if (key === "meal_types") {
      return;
    }

    let newKey = key;

    if (key.includes("_desiata")) {
      newKey = key.replace("_desiata", "_snack");
    } else if (key.includes("_dezert")) {
      newKey = key.replace("_dezert", "_snack");
    } else if (key.includes("_breakfast")) {
      newKey = key.replace("_breakfast", "_ranajky");
    } else if (key.includes("_lunch")) {
      newKey = key.replace("_lunch", "_hlavne_jedlo");
    } else if (key.includes("_dinner")) {
      newKey = key.replace("_dinner", "_vecera");
    }

    if (!result[newKey] || newKey === key) {
      result[newKey] = value;
    }
  });

  return result as MealPlanData;
};

export const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const getDaysCount = (planType: string) => (planType === "weekly" ? 7 : 30);

export const getActiveMealTypes = (selectedMealTypes: string[]) => {
  const orderedIds = MEAL_TYPE_OPTIONS.map((option) => option.id);
  return orderedIds.filter((id) => selectedMealTypes.includes(id));
};
