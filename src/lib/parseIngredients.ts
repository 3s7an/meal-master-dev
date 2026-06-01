import type { Ingredient } from "@/types/recipe";
import type { Json } from "@/integrations/supabase/types";

export function parseIngredients(raw: Json): Ingredient[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => {
      if (typeof item !== "object" || item === null) {
        return null;
      }
      const obj = item as Record<string, unknown>;
      return {
        name: String(obj.name ?? ""),
        quantity: Number(obj.quantity) || 0,
        unit: String(obj.unit ?? ""),
      };
    })
    .filter((item): item is Ingredient => item !== null);
}
