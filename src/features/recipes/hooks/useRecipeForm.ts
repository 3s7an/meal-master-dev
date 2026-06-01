import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { DEFAULT_CATEGORY, normalizeCategory } from "@/constants/categories";
import { recipeSchema } from "@/lib/validations";
import {
  createRecipe,
  deleteRecipe,
  insertShoppingListItems,
  updateRecipe,
  updateRecipeImageUrl,
  uploadRecipeImage,
} from "../api/recipesRepository";
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
        is_public: recipe.is_public ?? false,
      });
      setIngredients(
        recipe.ingredients.length > 0 ? recipe.ingredients : [{ name: "", quantity: 0, unit: "" }],
      );
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

    if (!file.type.startsWith("image/")) {
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
      const { publicUrl, error } = await uploadRecipeImage(userId, imageFile, recipeId);

      if (error) {
        if (
          error.message.includes("not found") ||
          error.message.includes("Bucket") ||
          error.message.includes("bucket")
        ) {
          toast({
            title: "Bucket neexistuje alebo nie je dostupný",
            description: `Bucket 'recipe-images' nebol nájdený. Skontrolujte: 1) Bucket je public, 2) RLS policies sú nastavené (Storage > Policies), 3) Ste prihlásený. Chyba: ${error.message}`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Chyba pri nahrávaní",
            description: error.message || "Nepodarilo sa nahrať obrázok.",
            variant: "destructive",
          });
        }
        return null;
      }

      return publicUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nepodarilo sa nahrať obrázok.";
      console.error("Upload error:", error);
      toast({
        title: "Chyba pri nahrávaní",
        description: message,
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const buildRecipePayload = (userId: string, imageUrl: string | null) => ({
    user_id: userId,
    name: formData.name,
    description: formData.description,
    category: formData.category,
    ingredients: ingredients.filter((item) => item.name),
    instructions: formData.instructions,
    calories: formData.calories ? parseInt(formData.calories, 10) : null,
    notes: formData.notes,
    is_public: formData.is_public,
    image_url: imageUrl,
  });

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

    const recipeData = buildRecipePayload(user.id, imageUrl);

    if (recipe) {
      const { error } = await updateRecipe(recipe.id, recipeData);

      if (error) {
        toast({
          title: "Chyba",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Recept aktualizovaný",
          description: "Recept bol úspešne aktualizovaný.",
        });
        onSuccess();
        onClose();
      }
    } else {
      const { error, data: result } = await createRecipe(recipeData);

      if (error) {
        toast({
          title: "Chyba",
          description: error.message,
          variant: "destructive",
        });
      } else {
        if (imageFile && result) {
          const newImageUrl = await uploadImage(user.id, result.id);
          if (newImageUrl) {
            await updateRecipeImageUrl(result.id, newImageUrl);
          }
        }

        toast({
          title: "Recept vytvorený",
          description: "Nový recept bol pridaný.",
        });
        onSuccess();
        onClose();
      }
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    if (!recipe) return;
    setLoading(true);

    const { error } = await deleteRecipe(recipe.id);

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
      .filter((item) => item.name)
      .map((item) => ({
        user_id: user.id,
        item_name: item.name,
        quantity: item.quantity || null,
        unit: item.unit || null,
        recipe_id: recipe.id,
        is_checked: false,
      }));

    const { error } = await insertShoppingListItems(items);

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
