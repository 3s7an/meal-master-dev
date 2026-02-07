import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ShoppingCart, Globe, Lock, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { CATEGORY_OPTIONS, DEFAULT_CATEGORY, normalizeCategory } from "@/constants/categories";
import { recipeSchema } from "@/lib/validations";

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
    category: DEFAULT_CATEGORY,
    instructions: "",
    calories: "",
    notes: "",
    is_public: false,
  });
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: "", quantity: 0, unit: "" },
  ]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (recipe) {
      setFormData({
        name: recipe.name,
        description: recipe.description,
        category: normalizeCategory(recipe.category),
        instructions: recipe.instructions,
        calories: recipe.calories?.toString() || "",
        notes: recipe.notes || "",
        is_public: (recipe as any).is_public || false,
      });
      setIngredients(recipe.ingredients.length > 0 ? recipe.ingredients : [{ name: "", quantity: 0, unit: "" }]);
      setImagePreview(recipe.image_url || null);
      setImageFile(null);
    } else {
      resetForm();
    }
  }, [recipe, open]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: DEFAULT_CATEGORY,
      instructions: "",
      calories: "",
      notes: "",
      is_public: false,
    });
    setIngredients([{ name: "", quantity: 0, unit: "" }]);
    setImageFile(null);
    setImagePreview(null);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Chyba",
        description: "Prosím vyberte obrázok (JPG, PNG alebo WEBP).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Chyba",
        description: "Obrázok je príliš veľký. Maximálna veľkosť je 5MB.",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async (userId: string, recipeId?: string): Promise<string | null> => {
    if (!imageFile) return null;

    setUploadingImage(true);
    try {
      // Diagnostic: Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast({
          title: "Nie ste prihlásený",
          description: "Pre nahrávanie obrázkov musíte byť prihlásený.",
          variant: "destructive",
        });
        setUploadingImage(false);
        return null;
      }

      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${userId}/${recipeId || Date.now()}.${fileExt}`;
      
      // Delete old image if updating existing recipe
      if (recipeId) {
        try {
          const { data: oldFiles } = await supabase.storage
            .from('recipe-images')
            .list(`${userId}/`, {
              search: recipeId
            });
          
          if (oldFiles && oldFiles.length > 0) {
            await supabase.storage
              .from('recipe-images')
              .remove(oldFiles.map(f => `${userId}/${f.name}`));
          }
        } catch (deleteError) {
          // Ignore delete errors, continue with upload
          console.warn('Error deleting old image:', deleteError);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('recipe-images')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
      console.error('Upload error:', uploadError);
        console.error('Error details:', {
          message: uploadError.message,
          error: uploadError
        });
        
        // Check if bucket doesn't exist
        if (uploadError.message.includes('not found') || uploadError.message.includes('Bucket') || uploadError.message.includes('bucket')) {
          toast({
            title: "Bucket neexistuje alebo nie je dostupný",
            description: `Bucket 'recipe-images' nebol nájdený. Skontrolujte: 1) Bucket je public, 2) RLS policies sú nastavené (Storage > Policies), 3) Ste prihlásený. Chyba: ${uploadError.message}`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Chyba pri nahrávaní",
            description: uploadError.message || "Nepodarilo sa nahrať obrázok.",
            variant: "destructive",
          });
        }
        return null;
      }

      const { data } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Chyba pri nahrávaní",
        description: error.message || "Nepodarilo sa nahrať obrázok.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = recipeSchema.safeParse(formData);
    if (!validation.success) {
      toast({
        title: "Chyba",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

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

    // Upload image if a new one was selected
    let imageUrl = recipe?.image_url || null;
    if (imageFile) {
      const uploadedUrl = await uploadImage(user.id, recipe?.id);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        setLoading(false);
        return; // Stop if image upload failed
      }
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
      is_public: formData.is_public,
      image_url: imageUrl,
    };

    let error;
    let result;
    if (recipe) {
      ({ error, data: result } = await supabase
        .from("recipes")
        .update(recipeData)
        .eq("id", recipe.id)
        .select()
        .single());
    } else {
      ({ error, data: result } = await supabase.from("recipes").insert(recipeData).select().single());
    }

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // If we created a new recipe and uploaded an image, update the image path with recipe ID
      if (!recipe && imageFile && result) {
        const newImageUrl = await uploadImage(user.id, result.id);
        if (newImageUrl) {
          await supabase
            .from("recipes")
            .update({ image_url: newImageUrl })
            .eq("id", result.id);
        }
      }

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
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG alebo WEBP (max. 5MB)
                  </p>
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
                    onChange={(e) => updateIngredient(index, "quantity", parseFloat(e.target.value) || 0)}
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
};

export default RecipeDialog;