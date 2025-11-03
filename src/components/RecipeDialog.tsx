import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

interface Recipe {
  id: string;
  name: string;
  description: string;
  category: string;
  ingredients: Ingredient[];
  instructions: string;
  image_url?: string;
  calories?: number;
  notes?: string;
}

interface RecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: Recipe | null;
  onSuccess: () => void;
}

const RecipeDialog = ({ open, onOpenChange, recipe, onSuccess }: RecipeDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "lunch",
    instructions: "",
    calories: "",
    notes: "",
  });
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: "", quantity: 0, unit: "" },
  ]);

  useEffect(() => {
    if (recipe) {
      setFormData({
        name: recipe.name,
        description: recipe.description,
        category: recipe.category,
        instructions: recipe.instructions,
        calories: recipe.calories?.toString() || "",
        notes: recipe.notes || "",
      });
      setIngredients(recipe.ingredients.length > 0 ? recipe.ingredients : [{ name: "", quantity: 0, unit: "" }]);
    } else {
      resetForm();
    }
  }, [recipe, open]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "lunch",
      instructions: "",
      calories: "",
      notes: "",
    });
    setIngredients([{ name: "", quantity: 0, unit: "" }]);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", quantity: 0, unit: "" }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Chyba",
        description: "Musíte byť prihlásený aby ste mohli vytvoriť recept.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const recipeData = {
      user_id: user.id,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      ingredients: ingredients.filter(i => i.name) as any,
      instructions: formData.instructions,
      calories: formData.calories ? parseInt(formData.calories) : null,
      notes: formData.notes,
    };

    let error;
    if (recipe) {
      ({ error } = await supabase
        .from("recipes")
        .update(recipeData)
        .eq("id", recipe.id));
    } else {
      ({ error } = await supabase.from("recipes").insert(recipeData));
    }

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: recipe ? "Recept aktualizovaný" : "Recept vytvorený",
        description: recipe ? "Recept bol úspešne aktualizovaný." : "Nový recept bol pridaný.",
      });
      onSuccess();
      onOpenChange(false);
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    if (!recipe) return;
    setLoading(true);

    const { error } = await supabase.from("recipes").delete().eq("id", recipe.id);

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Recept odstránený",
        description: "Recept bol úspešne odstránený.",
      });
      onSuccess();
      onOpenChange(false);
    }

    setLoading(false);
  };

  const addToShoppingList = async () => {
    if (!recipe) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const items = ingredients
      .filter(i => i.name)
      .map(i => ({
        user_id: user.id,
        item_name: i.name,
        quantity: i.quantity || null,
        unit: i.unit || null,
        recipe_id: recipe.id,
        is_checked: false,
      }));

    const { error } = await supabase.from("shopping_list").insert(items);

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Pridané do zoznamu",
        description: `${items.length} položiek bolo pridaných do nákupného zoznamu.`,
      });
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{recipe ? "Upraviť recept" : "Nový recept"}</DialogTitle>
          <DialogDescription>
            {recipe ? "Upravte detaily receptu" : "Pridajte nový recept do svojej zbierky"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Názov receptu *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Popis</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategória *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Raňajky</SelectItem>
                  <SelectItem value="lunch">Obed</SelectItem>
                  <SelectItem value="dinner">Večera</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="calories">Kalórie</Label>
              <Input
                id="calories"
                type="number"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Ingrediencie *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                <Plus className="w-4 h-4 mr-1" />
                Pridať
              </Button>
            </div>
            {ingredients.map((ingredient, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Názov ingrediencie"
                  value={ingredient.name}
                  onChange={(e) => updateIngredient(index, "name", e.target.value)}
                  className="flex-1 min-w-0"
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Mn."
                    type="number"
                    value={ingredient.quantity || ""}
                    onChange={(e) => updateIngredient(index, "quantity", parseFloat(e.target.value) || 0)}
                    className="w-16 sm:w-20"
                  />
                  <Input
                    placeholder="jedn."
                    value={ingredient.unit}
                    onChange={(e) => updateIngredient(index, "unit", e.target.value)}
                    className="w-16 sm:w-20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeIngredient(index)}
                    disabled={ingredients.length === 1}
                    className="shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Postup prípravy</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Poznámky</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex gap-2 justify-between">
            <div className="flex gap-2">
              {recipe && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addToShoppingList}
                    disabled={loading}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Do nákupu
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Odstrániť
                  </Button>
                </>
              )}
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Ukladám..." : recipe ? "Uložiť" : "Vytvoriť"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RecipeDialog;