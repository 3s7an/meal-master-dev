import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Ingredient } from "@/types/recipe";

interface RecipeIngredientsFormProps {
  ingredients: Ingredient[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof Ingredient, value: string | number) => void;
}

export function RecipeIngredientsForm({
  ingredients,
  onAdd,
  onRemove,
  onUpdate,
}: RecipeIngredientsFormProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Ingrediencie *</Label>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus className="w-4 h-4 mr-1" />
          Pridať
        </Button>
      </div>
      {ingredients.map((ingredient, index) => (
        <div key={index} className="space-y-2 border rounded-lg p-3">
          <div className="flex gap-2">
            <Input
              placeholder="Názov ingrediencie"
              value={ingredient.name}
              onChange={(e) => onUpdate(index, "name", e.target.value)}
              className="flex-1 min-w-0"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(index)}
              disabled={ingredients.length === 1}
              className="shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Množstvo"
              type="number"
              value={ingredient.quantity || ""}
              onChange={(e) => onUpdate(index, "quantity", parseFloat(e.target.value) || 0)}
              className="flex-1"
            />
            <Input
              placeholder="Jednotka"
              value={ingredient.unit}
              onChange={(e) => onUpdate(index, "unit", e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
