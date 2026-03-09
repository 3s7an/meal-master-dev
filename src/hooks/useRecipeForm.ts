import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { DEFAULT_CATEGORY, normalizeCategory } from "@/constants/categories";
import { recipeSchema } from "@/lib/validations";
import type { Recipe, Ingredient } from "@/types/recipe";

interface UseRecipeFormOptions {
  recipe: Recipe | null;
  open: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export function useRecipeForm({ recipe, open, onSuccess, onClose }: UseRecipeFormOptions) {
  const { toast } = useToast();
  const { user } = useAuth();
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

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Chyba",
        description: "Prosím vyberte obrázok (JPG, PNG alebo WEBP).",
        variant: "destructive",
      });
      return;
    }

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
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${userId}/${recipeId || Date.now()}.${fileExt}`;
      
      if (recipeId) {
        try {
          const { data: oldFiles } = await supabase.storage
            .from('recipe-images')
            .list(`${userId}/`, { search: recipeId });
          
          if (oldFiles && oldFiles.length > 0) {
            await supabase.storage
              .from('recipe-images')
              .remove(oldFiles.map(f => `${userId}/${f.name}`));
          }
        } catch (deleteError) {
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

    if (!user) {
      toast({
        title: "Chyba",
        description: "Musíte byť prihlásený aby ste mohli vytvoriť recept.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    let imageUrl = recipe?.image_url || null;
    if (imageFile) {
      const uploadedUrl = await uploadImage(user.id, recipe?.id);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        setLoading(false);
        return;
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
      onClose();
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
      onClose();
    }

    setLoading(false);
  };

  const addToShoppingList = async () => {
    if (!recipe || !user) return;
    setLoading(true);

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

  return {
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
  };
}
