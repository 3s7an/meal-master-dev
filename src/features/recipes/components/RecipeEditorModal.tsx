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
import { Plus, Trash2, ShoppingCart, Globe, Lock, X, Image as ImageIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { CATEGORY_OPTIONS } from "@/constants/categories";
import { useRecipeForm } from "@/features/recipes/hooks/useRecipeForm";
import type { Recipe } from "@/types/recipe";

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{recipe ? "Upraviť recept" : "Nový recept"}</DialogTitle>
          <DialogDescription>
            {recipe ? "Upravte detaily receptu" : "Pridajte nový recept do svojej zbierky"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="image">Fotka receptu</Label>
            <div className="space-y-3">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 md:h-80 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                    disabled={uploadingImage || loading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Kliknite alebo presuňte obrázok sem
                  </p>
                  <p className="text-xs text-muted-foreground">JPG, PNG alebo WEBP (max. 5MB)</p>
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  id="image"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  disabled={uploadingImage || loading}
                  className="cursor-pointer"
                />
                {imagePreview && !imageFile && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={removeImage}
                    disabled={uploadingImage || loading}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Odstrániť
                  </Button>
                )}
              </div>
              {uploadingImage && (
                <p className="text-sm text-muted-foreground">Nahrávam obrázok...</p>
              )}
            </div>
          </div>

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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Ingrediencie *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
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
                    onChange={(e) => updateIngredient(index, "name", e.target.value)}
                    className="flex-1 min-w-0"
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
                <div className="flex gap-2">
                  <Input
                    placeholder="Množstvo"
                    type="number"
                    value={ingredient.quantity || ""}
                    onChange={(e) =>
                      updateIngredient(index, "quantity", parseFloat(e.target.value) || 0)
                    }
                    className="flex-1"
                  />
                  <Input
                    placeholder="Jednotka"
                    value={ingredient.unit}
                    onChange={(e) => updateIngredient(index, "unit", e.target.value)}
                    className="flex-1"
                  />
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

          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {formData.is_public ? (
                <Globe className="w-5 h-5 text-primary" />
              ) : (
                <Lock className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <Label htmlFor="is_public" className="cursor-pointer">
                  {formData.is_public ? "Verejný recept" : "Súkromný recept"}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {formData.is_public
                    ? "Recept uvidia všetci používatelia"
                    : "Recept uvidíte len vy"}
                </p>
              </div>
            </div>
            <Switch
              id="is_public"
              checked={formData.is_public}
              onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
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
}
