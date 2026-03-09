import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { addDays, format } from "date-fns";
import { sk } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";

export interface MealPlan {
  id: string;
  name: string;
  plan_type: string;
  meals_per_day: number;
  start_date: string;
  plan_data: any;
}

interface Recipe {
  id: string;
  name: string;
}

const FALLBACK_MEAL_TYPES = ["ranajky", "snack", "polievka", "hlavne_jedlo", "vecera"];

const normalizeMealType = (id: string) => {
  if (id === "desiata" || id === "dezert") {
    return "snack";
  }
  return id;
};

const normalizeMealTypes = (types: string[] = []) => {
  const normalized = types.map(normalizeMealType);
  return Array.from(new Set(normalized));
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const migratePlanDataKeys = (data: any = {}) => {
  const result: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (key === "meal_types") {
      return;
    }
    let newKey = key;
    if (key.includes("_desiata")) {
      newKey = key.replace("_desiata", "_snack");
    }
    if (key.includes("_dezert")) {
      newKey = key.replace("_dezert", "_snack");
    }
    result[newKey] = value;
  });
  return result;
};

export function useMealPlans() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);

  const isAuthenticated = !!user;

  const fetchPlans = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setPlans([]);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Chyba",
        description: "Nepodarilo sa načítať jedálničky.",
        variant: "destructive",
      });
    } else {
      setPlans(data || []);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setDialogOpen(true);
  };

  const handleEditPlan = (plan: MealPlan) => {
    setSelectedPlan(plan);
    setDialogOpen(true);
  };

  const deletePlan = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("meal_plans")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Plán odstránený",
        description: "Jedálniček bol odstránený.",
      });
      fetchPlans();
    }
  };

  const exportMealPlan = async (plan: MealPlan) => {
    try {
      const { data: recipesData } = await supabase
        .from("recipes")
        .select("id, name")
        .order("name");

      const recipes: Recipe[] = recipesData || [];

      const daysCount = plan.plan_type === "weekly" ? 7 : 30;
      const normalizedMealTypes = normalizeMealTypes(plan.plan_data?.meal_types || FALLBACK_MEAL_TYPES);
      const activeMealTypes = FALLBACK_MEAL_TYPES.filter((type) => normalizedMealTypes.includes(type));
      const startDate = new Date(plan.start_date);
      const planData = migratePlanDataKeys(plan.plan_data || {});

      const pdfDoc = await PDFDocument.create();
      const width = 595;
      const height = 842;

      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const sanitizeText = (text: string) =>
        text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      const centerText = (text: string, font: { widthOfTextAtSize: (t: string, s: number) => number }, fontSize: number) => {
        const textWidth = font.widthOfTextAtSize(sanitizeText(text), fontSize);
        return (width - textWidth) / 2;
      };

      const drawHeader = async (page: any) => {
        page.drawRectangle({
          x: 0,
          y: height - 50,
          width,
          height: 50,
          color: rgb(1, 1, 1),
        });

        const planTypeText = sanitizeText(plan.plan_type === "weekly" ? "Tyzdnovy plan" : "Mesacny plan");
        page.drawText(planTypeText, {
          x: centerText(planTypeText, helveticaFont, 11),
          y: height - 25,
          size: 11,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });

        const periodText = sanitizeText(
          `Obdobie: ${format(startDate, "dd.MM.yyyy")} - ${format(
            addDays(startDate, daysCount - 1),
            "dd.MM.yyyy"
          )}`
        );
        page.drawText(periodText, {
          x: centerText(periodText, helveticaFont, 11),
          y: height - 40,
          size: 11,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      };

      const tableData: string[][] = [];
      const dayNames: Record<string, string> = {
        "pondelok": "Pondelok",
        "utorok": "Utorok",
        "streda": "Streda",
        "štvrtok": "Stvrtok",
        "piatok": "Piatok",
        "sobota": "Sobota",
        "nedeľa": "Nedela"
      };
      const mealTypeLabels: Record<string, string> = {
        "ranajky": "Raňajky",
        "snack": "Snack",
        "polievka": "Polievka",
        "hlavne_jedlo": "Hlavne jedlo",
        "vecera": "Večera",
        "desiata": "Snack",
        "dezert": "Snack",
      };

      for (let day = 1; day <= daysCount; day++) {
        const currentDate = addDays(startDate, day - 1);
        const dayNameSk = format(currentDate, "EEEE", { locale: sk }).toLowerCase();
        const fallbackDayName = format(currentDate, "EEEE", { locale: sk });
        const dayName = dayNames[dayNameSk] || capitalize(fallbackDayName);
        const dateStr = format(currentDate, "dd.MM.yyyy");

        const meals: string[] = [];
        activeMealTypes.forEach((mealType: string) => {
          const normalizedMealType = normalizeMealType(mealType);
          const mealLabel = mealTypeLabels[normalizedMealType] || normalizedMealType;
          const key = `day_${day}_${normalizedMealType}`;
          const recipeId = planData[key];
          const recipe = recipes.find(r => r.id === recipeId);
          const recipeName = recipe ? recipe.name : "Neplanovane";
          meals.push(`${sanitizeText(mealLabel)}: ${sanitizeText(recipeName)}`);
        });

        tableData.push([
          sanitizeText(dateStr),
          sanitizeText(dayName),
          sanitizeText(meals.join("\n"))
        ]);
      }

      let currentPage = pdfDoc.addPage([595, 842]);
      await drawHeader(currentPage);

      const rowHeight = 35;
      const headerHeight = 20;
      const startY = height - 55;
      let currentY = startY;
      const bottomMargin = 50;

      currentPage.drawRectangle({
        x: 0,
        y: currentY - headerHeight,
        width,
        height: headerHeight,
        color: rgb(0.086, 0.639, 0.290),
      });

      const headers = ["Datum", "Den", "Jedla"];
      const colWidths = [90, 70, 435];
      let xPos = 0;
      headers.forEach((header, idx) => {
        currentPage.drawText(sanitizeText(header), {
          x: xPos + (idx === 2 ? 5 : colWidths[idx] / 2 - 10),
          y: currentY - 13,
          size: 11,
          font: helveticaBoldFont,
          color: rgb(1, 1, 1),
        });
        xPos += colWidths[idx];
      });

      currentY -= headerHeight;

      for (let rowIdx = 0; rowIdx < tableData.length; rowIdx++) {
        const row = tableData[rowIdx];
        if (currentY < bottomMargin + rowHeight) {
          currentPage = pdfDoc.addPage([595, 842]);
          await drawHeader(currentPage);
          currentY = startY - headerHeight;

          currentPage.drawRectangle({
            x: 0,
            y: currentY,
            width,
            height: headerHeight,
            color: rgb(0.086, 0.639, 0.290),
          });
          xPos = 0;
          headers.forEach((header, idx) => {
            currentPage.drawText(sanitizeText(header), {
              x: xPos + (idx === 2 ? 5 : colWidths[idx] / 2 - 10),
              y: currentY + 7,
              size: 11,
              font: helveticaBoldFont,
              color: rgb(1, 1, 1),
            });
            xPos += colWidths[idx];
          });
          currentY -= headerHeight;
        }

        if (rowIdx % 2 === 0) {
          currentPage.drawRectangle({
            x: 0,
            y: currentY - rowHeight,
            width,
            height: rowHeight,
            color: rgb(0.96, 0.96, 0.98),
          });
        }

        xPos = 0;
        colWidths.forEach((colWidth) => {
          currentPage.drawLine({
            start: { x: xPos, y: currentY },
            end: { x: xPos, y: currentY - rowHeight },
            thickness: 0.5,
            color: rgb(0.8, 0.8, 0.8),
          });
          xPos += colWidth;
        });

        xPos = 0;
        row.forEach((cell, cellIdx) => {
          const lines = cell.split("\n");
          const lineSpacing = 12;
          const startYOffset = rowHeight / 2 - (lines.length - 1) * lineSpacing / 2;
          lines.forEach((line, lineIdx) => {
            currentPage.drawText(sanitizeText(line), {
              x: xPos + (cellIdx === 2 ? 5 : colWidths[cellIdx] / 2 - 10),
              y: currentY - startYOffset - (lineIdx * lineSpacing),
              size: 9,
              font: helveticaFont,
              color: rgb(0, 0, 0),
            });
          });
          xPos += colWidths[cellIdx];
        });

        currentY -= rowHeight;
      }

      const lastPage = pdfDoc.getPage(pdfDoc.getPageCount() - 1);
      lastPage.drawLine({
        start: { x: 0, y: currentY },
        end: { x: width, y: currentY },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });

      const totalPages = pdfDoc.getPageCount();
      for (let i = 0; i < totalPages; i++) {
        const page = pdfDoc.getPage(i);
        const pageText = sanitizeText(`Strana ${i + 1} z ${totalPages}`);
        page.drawText(pageText, {
          x: centerText(pageText, helveticaFont, 8),
          y: 15,
          size: 8,
          font: helveticaFont,
          color: rgb(0.4, 0.4, 0.4),
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mealplan-${sanitizeText(plan.name || "plan")
        .toLowerCase()
        .replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export hotovy",
        description: "Jedalnicek bol exportovany do PDF.",
      });
    } catch (error) {
      console.error("Error creating PDF:", error);
      toast({
        title: "Chyba",
        description: "Nepodarilo sa vytvoriť PDF súbor.",
        variant: "destructive",
      });
    }
  };

  const generateShoppingList = async (plan: MealPlan) => {
    try {
      if (!user) {
        toast({
          title: "Chyba",
          description: "Musíte byť prihlásený.",
          variant: "destructive",
        });
        return;
      }

      const daysCount = plan.plan_type === "weekly" ? 7 : 30;
      const normalizedMealTypes = normalizeMealTypes(plan.plan_data?.meal_types || FALLBACK_MEAL_TYPES);
      const activeMealTypes = FALLBACK_MEAL_TYPES.filter((type) => normalizedMealTypes.includes(type));
      const planData = migratePlanDataKeys(plan.plan_data || {});

      const recipeIds = new Set<string>();
      for (let day = 1; day <= daysCount; day++) {
        activeMealTypes.forEach((mealType: string) => {
          const normalizedMealType = normalizeMealType(mealType);
          const key = `day_${day}_${normalizedMealType}`;
          const recipeId = planData[key];
          if (recipeId && recipeId !== "none") {
            recipeIds.add(recipeId);
          }
        });
      }

      if (recipeIds.size === 0) {
        toast({
          title: "Upozornenie",
          description: "Jedálny plán neobsahuje žiadne recepty.",
          variant: "destructive",
        });
        return;
      }

      const { data: recipesData, error: recipesError } = await supabase
        .from("recipes")
        .select("id, name, ingredients")
        .in("id", Array.from(recipeIds));

      if (recipesError) {
        toast({
          title: "Chyba",
          description: "Nepodarilo sa načítať recepty.",
          variant: "destructive",
        });
        return;
      }

      interface IngredientGroup {
        name: string;
        quantity: number;
        unit: string;
      }

      const ingredientMap = new Map<string, IngredientGroup>();

      recipesData?.forEach((recipe: any) => {
        const ingredients = recipe.ingredients || [];
        if (Array.isArray(ingredients)) {
          ingredients.forEach((ing: any) => {
            if (ing.name && ing.name.trim()) {
              const normalizedName = ing.name.trim().toLowerCase();
              const unit = (ing.unit || "").trim().toLowerCase();
              const key = `${normalizedName}_${unit}`;
              const quantity = parseFloat(ing.quantity) || 0;

              if (ingredientMap.has(key)) {
                const existing = ingredientMap.get(key)!;
                existing.quantity += quantity;
              } else {
                ingredientMap.set(key, {
                  name: ing.name.trim(),
                  quantity: quantity,
                  unit: ing.unit || "",
                });
              }
            }
          });
        }
      });

      if (ingredientMap.size === 0) {
        toast({
          title: "Upozornenie",
          description: "Recepty v pláne nemajú žiadne ingrediencie.",
          variant: "destructive",
        });
        return;
      }

      const shoppingItems = Array.from(ingredientMap.values()).map((ing) => ({
        user_id: user.id,
        item_name: ing.name,
        quantity: ing.quantity > 0 ? ing.quantity : null,
        unit: ing.unit || null,
        is_checked: false,
      }));

      const { error: insertError } = await supabase
        .from("shopping_list")
        .insert(shoppingItems);

      if (insertError) {
        toast({
          title: "Chyba",
          description: insertError.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Nákupný zoznam vytvorený",
        description: `Bolo pridaných ${shoppingItems.length} položiek do nákupného zoznamu.`,
      });
    } catch (error) {
      console.error("Error generating shopping list:", error);
      toast({
        title: "Chyba",
        description: "Nepodarilo sa vytvoriť nákupný zoznam.",
        variant: "destructive",
      });
    }
  };

  return {
    plans,
    loading,
    dialogOpen,
    setDialogOpen,
    selectedPlan,
    isAuthenticated,
    fetchPlans,
    handleCreatePlan,
    handleEditPlan,
    deletePlan,
    exportMealPlan,
    generateShoppingList,
  };
}
