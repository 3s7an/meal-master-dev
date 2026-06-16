import { ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_OPTIONS } from "@/constants/categories";
import { useRecipeForm } from "@/features/recipes/hooks/useRecipeForm";
import type { Recipe } from "@/types/recipe";
import { RecipeImageUpload } from "./RecipeImageUpload";
import { RecipeIngredientsForm } from "./RecipeIngredientsForm";
import { RecipeVisibilityToggle } from "./RecipeVisibilityToggle";

interface RecipeEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: Recipe | null;
  onSuccess: () => void;
}

export function RecipeEditorModal({
  open,
  onOpenChange,
  recipe,
  onSuccess,
}: RecipeEditorModalProps) {
  const {
    loading,
    uploadingImage,
    formData,
    setFormData,
    ingredients,
    imagePreview,
    imageFile,
    addIngredient,
    removeIngredient,
    updateIngredient,
    handleImageChange,
    removeImage,
    handleSubmit,
    handleDelete,
    addToShoppingList,
  } = useRecipeForm({
    recipe,
    open,
    onSuccess,
    onClose: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{recipe ? "Upraviť recept" : "Nový recept"}</DialogTitle>
          <DialogDescription>
            {recipe ? "Upravte detaily receptu" : "Pridajte nový recept do svojej zbierky"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RecipeImageUpload
              imagePreview={imagePreview}
              imageFile={imageFile}
              uploadingImage={uploadingImage}
              loading={loading}
              onImageChange={handleImageChange}
              onRemoveImage={removeImage}
            />

            <div className="space-y-4">
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
                  rows={3}
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
                      {CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
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

              <RecipeVisibilityToggle
                isPublic={formData.is_public}
                onChange={(checked) => setFormData({ ...formData, is_public: checked })}
              />
            </div>
          </div>

          <RecipeIngredientsForm
            ingredients={ingredients}
            onAdd={addIngredient}
            onRemove={removeIngredient}
            onUpdate={updateIngredient}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="instructions">Postup prípravy</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Poznámky</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={5}
              />
            </div>
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
}
