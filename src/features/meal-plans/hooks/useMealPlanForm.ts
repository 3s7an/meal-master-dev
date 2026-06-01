import { useEffect, useState } from "react";
import { addDays, format } from "date-fns";
import { sk } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { mealPlanSchema } from "@/lib/validations";
import {
  createMealPlan,
  deleteMealPlan,
  fetchRecipesForPicker,
  updateMealPlan,
} from "../api/mealPlansRepository";
import { DEFAULT_MEAL_TYPES } from "../lib/mealPlanConstants";
import {
  capitalize,
  getActiveMealTypes,
  getDaysCount,
  migratePlanDataKeys,
  normalizeMealType,
  normalizeMealTypes,
} from "../lib/mealPlanUtils";
import { exportEditorMealPlanPdf } from "../services/mealPlanExportService";
import type { MealPlan, MealPlanData, MealPlanRecipeOption } from "@/types/mealPlan";

interface UseMealPlanFormOptions {
  plan: MealPlan | null;
  open: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export function useMealPlanForm({ plan, open, onSuccess, onClose }: UseMealPlanFormOptions) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<MealPlanRecipeOption[]>([]);
  const [recipesLoaded, setRecipesLoaded] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    plan_type: "weekly",
    start_date: new Date().toISOString().split("T")[0],
  });
  const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>(DEFAULT_MEAL_TYPES);
  const [planData, setPlanData] = useState<MealPlanData>({});
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({});

  const resetForm = () => {
    setFormData({
      name: "",
      plan_type: "weekly",
      start_date: new Date().toISOString().split("T")[0],
    });
    setSelectedMealTypes(DEFAULT_MEAL_TYPES);
    setPlanData({});
  };

  const loadRecipes = async () => {
    const { data, error } = await fetchRecipesForPicker();

    if (error) {
      console.error("Error fetching recipes:", error);
      setRecipes([]);
      return;
    }

    setRecipes(data ?? []);
  };

  useEffect(() => {
    if (!open) {
      setRecipesLoaded(false);
      setRecipes([]);
      setOpenPopovers({});
      return;
    }

    setRecipesLoaded(false);

    loadRecipes().then(() => {
      setRecipesLoaded(true);

      if (plan) {
        setFormData({
          name: plan.name,
          plan_type: plan.plan_type,
          start_date: plan.start_date,
        });
        setSelectedMealTypes(normalizeMealTypes(plan.plan_data?.meal_types || DEFAULT_MEAL_TYPES));
        setPlanData(migratePlanDataKeys(plan.plan_data || {}));
      } else {
        resetForm();
      }
    });
  }, [plan, open]);

  const setMealForDay = (day: number, mealType: string, recipeId: string | null) => {
    const normalizedMealType = normalizeMealType(mealType);
    const key = `day_${day}_${normalizedMealType}`;
    setPlanData((prev) => ({
      ...prev,
      [key]: recipeId,
    }));
  };

  const getMealForDay = (day: number, mealType: string): string => {
    const normalizedMealType = normalizeMealType(mealType);
    const key = `day_${day}_${normalizedMealType}`;
    const value = planData[key];

    if (!value || value === "none" || value === "") {
      return "none";
    }

    if (recipesLoaded && recipes.length > 0) {
      const recipeExists = recipes.some((r) => r.id === value);
      if (!recipeExists) {
        return "none";
      }
    }

    return String(value);
  };

  const toggleMealType = (mealTypeId: string) => {
    setSelectedMealTypes((prev) =>
      prev.includes(mealTypeId)
        ? prev.filter((id) => id !== mealTypeId)
        : [...prev, mealTypeId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = mealPlanSchema.safeParse(formData);
    if (!validation.success) {
      toast({
        title: "Chyba",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    if (selectedMealTypes.length === 0) {
      toast({
        title: "Chyba",
        description: "Musíte vybrať aspoň jeden typ jedla.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Chyba",
        description: "Musíte byť prihlásený.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const normalizedPlanData = migratePlanDataKeys(planData);
    const cleanedPlanData: MealPlanData = {};

    Object.entries(normalizedPlanData).forEach(([key, value]) => {
      const keyParts = key.split("_");
      if (keyParts.length >= 3 && keyParts[0] === "day") {
        const mealType = keyParts.slice(2).join("_");
        if (selectedMealTypes.includes(mealType)) {
          cleanedPlanData[key] = value;
        }
      } else {
        cleanedPlanData[key] = value;
      }
    });

    const mealPlanPayload = {
      user_id: user.id,
      name: formData.name,
      plan_type: formData.plan_type,
      meals_per_day: selectedMealTypes.length,
      start_date: formData.start_date,
      plan_data: { ...cleanedPlanData, meal_types: selectedMealTypes },
    };

    const { error } = plan
      ? await updateMealPlan(plan.id, user.id, mealPlanPayload)
      : await createMealPlan(mealPlanPayload);

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: plan ? "Plán aktualizovaný" : "Plán vytvorený",
        description: plan
          ? "Jedálniček bol úspešne aktualizovaný."
          : "Nový jedálniček bol vytvorený.",
      });
      onSuccess();
      onClose();
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    if (!plan || !user) return;

    setLoading(true);

    const { error } = await deleteMealPlan(plan.id, user.id);

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Plán odstránený",
        description: "Jedálniček bol úspešne odstránený.",
      });
      onSuccess();
      onClose();
    }

    setLoading(false);
  };

  const exportMealPlan = () => {
    if (!plan) return;

    exportEditorMealPlanPdf({
      name: formData.name,
      planType: formData.plan_type,
      startDate: formData.start_date,
      planData,
      selectedMealTypes,
      recipes,
      getMealForDay,
    });

    toast({
      title: "Export hotovy",
      description: "Jedalnicky boli exportovane do PDF.",
    });
  };

  const daysCount = getDaysCount(formData.plan_type);
  const activeMealTypes = getActiveMealTypes(selectedMealTypes);

  const mealPlanDays = Array.from({ length: daysCount }).map((_, dayIndex) => {
    const dayDate = addDays(new Date(formData.start_date), dayIndex);
    const dayName = format(dayDate, "EEEE", { locale: sk });
    const dayLabel = capitalize(dayName);
    const dateStr = format(dayDate, "dd.MM.yyyy");

    return {
      dayIndex,
      dayNumber: dayIndex + 1,
      dayLabel,
      dateStr,
    };
  });

  return {
    loading,
    recipes,
    recipesLoaded,
    formData,
    setFormData,
    selectedMealTypes,
    planData,
    openPopovers,
    setOpenPopovers,
    toggleMealType,
    setMealForDay,
    getMealForDay,
    handleSubmit,
    handleDelete,
    exportMealPlan,
    mealPlanDays,
    activeMealTypes,
    isEditing: !!plan,
  };
}
