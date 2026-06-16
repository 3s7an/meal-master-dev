import { useState, useEffect, useCallback } from "react";
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
} from "../api/recipesRepository";
import type { Recipe, Ingredient } from "@/types/recipe";
import { useRecipeImage } from "./useRecipeImage";

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
  const { imageFile, imagePreview, uploadingImage, handleImageChange, removeImage, loadImage, uploadImage } = useRecipeImage();

  const resetForm = useCallback(() => {
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
    removeImage();
  }, [removeImage]);

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
      loadImage(recipe.image_url || null);
    } else {
      resetForm();
    }
  }, [recipe, open, loadImage, resetForm]);

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
        toast({ title: "Chyba", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Recept aktualizovaný", description: "Recept bol úspešne aktualizovaný." });
        onSuccess();
        onClose();
      }
    } else {
      const { error, data: result } = await createRecipe(recipeData);

      if (error) {
        toast({ title: "Chyba", description: error.message, variant: "destructive" });
      } else {
        if (imageFile && result) {
          const newImageUrl = await uploadImage(user.id, result.id);
          if (newImageUrl) {
            await updateRecipeImageUrl(result.id, newImageUrl);
          }
        }

        toast({ title: "Recept vytvorený", description: "Nový recept bol pridaný." });
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
      toast({ title: "Chyba", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Recept odstránený", description: "Recept bol úspešne odstránený." });
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
      toast({ title: "Chyba", description: error.message, variant: "destructive" });
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
    uploadingImage: uploadingImage,
    formData,
    setFormData,
    ingredients,
    imagePreview: imagePreview,
    imageFile: imageFile,
    addIngredient,
    removeIngredient,
    updateIngredient,
    handleImageChange: handleImageChange,
    removeImage: removeImage,
    handleSubmit,
    handleDelete,
    addToShoppingList,
  };
}
