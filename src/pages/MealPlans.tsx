import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar as CalendarIcon, Trash2, Edit, Download, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MealPlanDialog from "@/components/MealPlanDialog";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { addDays, format } from "date-fns";
import { sk } from "date-fns/locale";

interface MealPlan {
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

const MealPlans = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPlans();
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
    if (!user) {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      setPlans([]);
      return;
    }

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
  };

  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setDialogOpen(true);
  };

  const handleEditPlan = (plan: MealPlan) => {
    setSelectedPlan(plan);
    setDialogOpen(true);
  };

  const deletePlan = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
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
      // Fetch recipes
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

      // Create PDF document
      const pdfDoc = await PDFDocument.create();
      
      // A4 page dimensions (595 x 842 points)
      const width = 595;
      const height = 842;

      // Load fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const sanitizeText = (text: string) =>
        text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      const centerText = (text: string, font: any, fontSize: number) => {
        const textWidth = font.widthOfTextAtSize(sanitizeText(text), fontSize);
        return (width - textWidth) / 2;
      };

      // Helper function to draw header
      const drawHeader = async (page: any) => {
        // Header background - WHITE background
        page.drawRectangle({
          x: 0,
          y: height - 50,
          width,
          height: 50,
          color: rgb(1, 1, 1), // White background
        });

        // Plan type - centered, black color, same font as period
        const planTypeText = sanitizeText(plan.plan_type === "weekly" ? "Tyzdnovy plan" : "Mesacny plan");
        page.drawText(planTypeText, {
          x: centerText(planTypeText, helveticaFont, 11),
          y: height - 25,
          size: 11,
          font: helveticaFont,
          color: rgb(0, 0, 0), // Black text
        });

        // Period - centered, black color, below plan type with larger spacing
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
          color: rgb(0, 0, 0), // Black text
        });
      };


      // Prepare table data
      const tableData: string[][] = [];
      
      // Slovak day names
      const dayNames: Record<string, string> = {
        "pondelok": "Pondelok",
        "utorok": "Utorok",
        "streda": "Streda",
        "štvrtok": "Stvrtok",
        "piatok": "Piatok",
        "sobota": "Sobota",
        "nedeľa": "Nedela"
      };
      
      // Slovak meal type names
      const mealTypeLabels: Record<string, string> = {
        "ranajky": "Raňajky",
        "snack": "Snack",
        "polievka": "Polievka",
        "hlavne_jedlo": "Hlavne jedlo",
        "vecera": "Večera",
        // Legacy labels
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

      // Create first page
      let currentPage = pdfDoc.addPage([595, 842]);
      await drawHeader(currentPage);
      
      // Draw table (split across pages if needed)
      const rowHeight = 35; // Increased row height for better spacing
      const headerHeight = 20;
      const startY = height - 55; // Reduced spacing from period to table
      let currentY = startY;
      const bottomMargin = 50;

      // Draw header row first
      currentPage.drawRectangle({
        x: 0,
        y: currentY - headerHeight,
        width,
        height: headerHeight,
        color: rgb(0.086, 0.639, 0.290),
      });

      const headers = ["Datum", "Den", "Jedla"];
      const colWidths = [90, 70, 435]; // Increased date column width from 60 to 90
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

      // Draw rows
      for (let rowIdx = 0; rowIdx < tableData.length; rowIdx++) {
        const row = tableData[rowIdx];
        // Check if we need a new page
        if (currentY < bottomMargin + rowHeight) {
          currentPage = pdfDoc.addPage([595, 842]);
          await drawHeader(currentPage);
          currentY = startY - headerHeight;
          
          // Redraw header row on new page
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

        // Alternate row color
        if (rowIdx % 2 === 0) {
          currentPage.drawRectangle({
            x: 0,
            y: currentY - rowHeight,
            width,
            height: rowHeight,
            color: rgb(0.96, 0.96, 0.98),
          });
        }

        // Draw cell borders
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

        // Draw cell content
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

      // Draw final bottom border
      const lastPage = pdfDoc.getPage(pdfDoc.getPageCount() - 1);
      lastPage.drawLine({
        start: { x: 0, y: currentY },
        end: { x: width, y: currentY },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });

      // Add footer to all pages
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

      // Save PDF
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
      const { data: { user } } = await supabase.auth.getUser();
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

      // Zbieranie všetkých recipe IDs z plánu
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

      // Načítanie receptov s ingredienciami
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

      // Zoskupenie a sčítanie ingrediencií
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

      // Vytvorenie položiek v nákupnom zozname
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

  return (
    <div className="space-y-8">
      {/* Banner Section */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl group">
        {/* Background Image */}
        <div className="relative h-64 md:h-80 lg:h-96">
          <img
            src="/images/section_masks/jedalny_listok_baner.png"
            alt="Jedálničky"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50" />
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>
        
        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-center justify-between p-6 md:p-12 lg:p-16">
          <div className="max-w-2xl space-y-5 animate-in fade-in slide-in-from-left-5 duration-700">
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-2xl leading-tight">
                Jedálničky
              </h1>
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-20 bg-white rounded-full" />
                <div className="h-1.5 w-12 bg-white/70 rounded-full" />
              </div>
            </div>
            <p className="text-lg md:text-xl lg:text-2xl text-white/95 font-medium drop-shadow-lg max-w-xl leading-relaxed">
              Plánujte svoje stravovanie
            </p>
          </div>
          {isAuthenticated && (
            <div className="hidden md:block">
              <Button onClick={handleCreatePlan} size="lg" className="gap-2 bg-background/90 hover:bg-background text-foreground shadow-lg">
                <Plus className="w-5 h-5" />
                Nový plán
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Add Button */}
      {isAuthenticated && (
        <div className="md:hidden">
          <Button onClick={handleCreatePlan} size="lg" className="gap-2 w-full">
            <Plus className="w-5 h-5" />
            Nový plán
          </Button>
        </div>
      )}

      {!isAuthenticated ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">Musíte byť prihlásený, aby ste mohli zobraziť jedálničky.</p>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Načítavam jedálničky...</p>
        </div>
      ) : plans.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Zatiaľ nemáte žiadne jedálničky</p>
            <Button onClick={handleCreatePlan}>
              <Plus className="w-4 h-4 mr-2" />
              Vytvoriť jedálniček
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>
                      {plan.plan_type === "weekly" ? "7 dní" : "30 dní"} • {plan.meals_per_day} jedlá/deň
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deletePlan(plan.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Od {new Date(plan.start_date).toLocaleDateString("sk-SK")}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1" 
                      variant="outline" 
                      onClick={() => exportMealPlan(plan)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button 
                      className="flex-1" 
                      variant="outline" 
                      onClick={() => handleEditPlan(plan)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Upraviť
                    </Button>
                  </div>
                  <Button 
                    className="w-full" 
                    variant="default" 
                    onClick={() => generateShoppingList(plan)}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Vytvoriť nákupný zoznam
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <MealPlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        plan={selectedPlan}
        onSuccess={fetchPlans}
      />
    </div>
  );
};

export default MealPlans;