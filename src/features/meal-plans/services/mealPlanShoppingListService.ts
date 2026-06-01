import {
  fetchRecipesWithIngredients,
  insertPlanShoppingListItems,
} from "../api/mealPlansRepository";
import { FALLBACK_MEAL_TYPES } from "../lib/mealPlanConstants";
import {
  migratePlanDataKeys,
  normalizeMealType,
  normalizeMealTypes,
  getDaysCount,
} from "../lib/mealPlanUtils";
import type { MealPlan } from "@/types/mealPlan";
import type { Ingredient } from "@/types/recipe";

interface IngredientGroup {
  name: string;
  quantity: number;
  unit: string;
}

export async function generateShoppingListFromPlan(userId: string, plan: MealPlan) {
  const daysCount = getDaysCount(plan.plan_type);
  const normalizedMealTypes = normalizeMealTypes(plan.plan_data?.meal_types || FALLBACK_MEAL_TYPES);
  const activeMealTypes = FALLBACK_MEAL_TYPES.filter((type) => normalizedMealTypes.includes(type));
  const planData = migratePlanDataKeys(plan.plan_data || {});

  const recipeIds = new Set<string>();
  for (let day = 1; day <= daysCount; day++) {
    activeMealTypes.forEach((mealType) => {
      const normalizedMealType = normalizeMealType(mealType);
      const key = `day_${day}_${normalizedMealType}`;
      const recipeId = planData[key];
      if (recipeId && recipeId !== "none") {
        recipeIds.add(String(recipeId));
      }
    });
  }

  if (recipeIds.size === 0) {
    return { error: null, warning: "no_recipes" as const, itemCount: 0 };
  }

  const { data: recipesData, error: recipesError } = await fetchRecipesWithIngredients(
    Array.from(recipeIds),
  );

  if (recipesError) {
    return { error: recipesError, warning: null, itemCount: 0 };
  }

  const ingredientMap = new Map<string, IngredientGroup>();

  recipesData?.forEach((recipe) => {
    const ingredients = (recipe.ingredients as Ingredient[] | null) ?? [];
    if (!Array.isArray(ingredients)) return;

    ingredients.forEach((ing) => {
      if (!ing.name?.trim()) return;

      const normalizedName = ing.name.trim().toLowerCase();
      const unit = (ing.unit || "").trim().toLowerCase();
      const key = `${normalizedName}_${unit}`;
      const quantity = parseFloat(String(ing.quantity)) || 0;

      if (ingredientMap.has(key)) {
        ingredientMap.get(key)!.quantity += quantity;
      } else {
        ingredientMap.set(key, {
          name: ing.name.trim(),
          quantity,
          unit: ing.unit || "",
        });
      }
    });
  });

  if (ingredientMap.size === 0) {
    return { error: null, warning: "no_ingredients" as const, itemCount: 0 };
  }

  const shoppingItems = Array.from(ingredientMap.values()).map((ing) => ({
    user_id: userId,
    item_name: ing.name,
    quantity: ing.quantity > 0 ? ing.quantity : null,
    unit: ing.unit || null,
    is_checked: false,
  }));

  const { error: insertError } = await insertPlanShoppingListItems(shoppingItems);

  if (insertError) {
    return { error: insertError, warning: null, itemCount: 0 };
  }

  return { error: null, warning: null, itemCount: shoppingItems.length };
}
