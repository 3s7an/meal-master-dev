import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, Download, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addDays, format } from "date-fns";
import { sk } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface MealPlan {
  id: string;
  name: string;
  plan_type: string;
  meals_per_day: number;
  start_date: string;
  plan_data: any;
  meal_types?: string[];
}

const MEAL_TYPE_OPTIONS = [
  { id: "ranajky", label: "Raňajky" },
  { id: "snack", label: "Snack" },
  { id: "polievka", label: "Polievka" },
  { id: "hlavne_jedlo", label: "Hlavné jedlo" },
  { id: "vecera", label: "Večera" },
];

const DEFAULT_MEAL_TYPES = ["ranajky", "snack", "polievka", "hlavne_jedlo", "vecera"];

const normalizeMealType = (id: string) => {
  if (id === "desiata" || id === "dezert") {
    return "snack";
  }
  return id;
};

const normalizeMealTypes = (types: string[] = []) => {
  const normalized = types.map(normalizeMealType);
  return Array.from(new Set(normalized)).filter((type) =>
    MEAL_TYPE_OPTIONS.some((option) => option.id === type)
  );
};

const migratePlanDataKeys = (data: any = {}) => {
  const result: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    // Skip meal_types, it will be handled separately
    if (key === "meal_types") {
      return;
    }
    
    let newKey = key;
    
    // Migrate old meal type keys to new format
    if (key.includes("_desiata")) {
      newKey = key.replace("_desiata", "_snack");
    } else if (key.includes("_dezert")) {
      newKey = key.replace("_dezert", "_snack");
    } else if (key.includes("_breakfast")) {
      newKey = key.replace("_breakfast", "_ranajky");
    } else if (key.includes("_lunch")) {
      newKey = key.replace("_lunch", "_hlavne_jedlo");
    } else if (key.includes("_dinner")) {
      newKey = key.replace("_dinner", "_vecera");
    }
    
    // Only keep the new key if it doesn't already exist
    // This prevents overwriting newer data with older migrated data
    if (!result[newKey] || newKey === key) {
      result[newKey] = value;
    }
  });
  return result;
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

interface Recipe {
  id: string;
  name: string;
  category: string;
}

interface MealPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: MealPlan | null;
  onSuccess: () => void;
}

const MealPlanDialog = ({ open, onOpenChange, plan, onSuccess }: MealPlanDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipesLoaded, setRecipesLoaded] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    plan_type: "weekly",
    start_date: new Date().toISOString().split("T")[0],
  });
  const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>(DEFAULT_MEAL_TYPES);
  const [planData, setPlanData] = useState<any>({});
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) {
      // Reset state when dialog opens
      setRecipesLoaded(false);
      
      // Load recipes first
      fetchRecipes().then(() => {
        setRecipesLoaded(true);
        
        // Then load plan data after recipes are loaded
        if (plan) {
          setFormData({
            name: plan.name,
            plan_type: plan.plan_type,
            start_date: plan.start_date,
          });
          const normalizedTypes = normalizeMealTypes(plan.plan_data?.meal_types || DEFAULT_MEAL_TYPES);
          setSelectedMealTypes(normalizedTypes);
          
          // Migrate old keys to new format while preserving all data
          const migratedData = migratePlanDataKeys(plan.plan_data || {});
          setPlanData(migratedData);
        } else {
          resetForm();
        }
      });
    } else {
      // Reset when dialog closes
      setRecipesLoaded(false);
      setRecipes([]);
      setOpenPopovers({});
    }
  }, [plan, open]);

  const resetForm = () => {
    setFormData({
      name: "",
      plan_type: "weekly",
      start_date: new Date().toISOString().split("T")[0],
    });
    setSelectedMealTypes(DEFAULT_MEAL_TYPES);
    setPlanData({});
  };

  const fetchRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from("recipes")
        .select("id, name, category")
        .order("name");
      
      if (error) {
        console.error("Error fetching recipes:", error);
        setRecipes([]);
        return;
      }
      
      setRecipes(data || []);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      setRecipes([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedMealTypes.length === 0) {
      toast({
        title: "Chyba",
        description: "Musíte vybrať aspoň jeden typ jedla.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Chyba",
        description: "Musíte byť prihlásený.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Migrate old keys to new format, but preserve all existing data
    const normalizedPlanData = migratePlanDataKeys(planData);
    
    // Clean up any keys that reference meal types that are no longer selected
    const cleanedPlanData: Record<string, any> = {};
    Object.entries(normalizedPlanData).forEach(([key, value]) => {
      // Keep only keys for selected meal types
      const keyParts = key.split('_');
      if (keyParts.length >= 3 && keyParts[0] === 'day') {
        const mealType = keyParts.slice(2).join('_');
        if (selectedMealTypes.includes(mealType)) {
          cleanedPlanData[key] = value;
        }
      } else {
        // Keep non-day keys (like meal_types if it exists)
        cleanedPlanData[key] = value;
      }
    });

    const mealPlanData = {
      user_id: user.id,
      name: formData.name,
      plan_type: formData.plan_type,
      meals_per_day: selectedMealTypes.length,
      start_date: formData.start_date,
      plan_data: { ...cleanedPlanData, meal_types: selectedMealTypes },
    };

    let error;
    if (plan) {
      ({ error } = await supabase
        .from("meal_plans")
        .update(mealPlanData)
        .eq("id", plan.id)
        .eq("user_id", user.id));
    } else {
      ({ error } = await supabase.from("meal_plans").insert(mealPlanData));
    }

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: plan ? "Plán aktualizovaný" : "Plán vytvorený",
        description: plan ? "Jedálniček bol úspešne aktualizovaný." : "Nový jedálniček bol vytvorený.",
      });
      onSuccess();
      onOpenChange(false);
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    if (!plan) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Chyba",
        description: "Musíte byť prihlásený.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("meal_plans")
      .delete()
      .eq("id", plan.id)
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
        description: "Jedálniček bol úspešne odstránený.",
      });
      onSuccess();
      onOpenChange(false);
    }

    setLoading(false);
  };

  const getDaysCount = () => {
    return formData.plan_type === "weekly" ? 7 : 30;
  };

  const getActiveMealTypes = () => {
    const orderedIds = MEAL_TYPE_OPTIONS.map((option) => option.id);
    return orderedIds.filter((id) => selectedMealTypes.includes(id));
  };

  const setMealForDay = (day: number, mealType: string, recipeId: string | null) => {
    const normalizedMealType = normalizeMealType(mealType);
    const key = `day_${day}_${normalizedMealType}`;
    setPlanData((prev: any) => ({
      ...prev,
      [key]: recipeId,
    }));
  };

  const getMealForDay = (day: number, mealType: string): string => {
    const normalizedMealType = normalizeMealType(mealType);
    const key = `day_${day}_${normalizedMealType}`;
    const value = planData[key];
    
    // Return "none" if value is null, undefined, empty string, or "none"
    if (!value || value === "none" || value === "") {
      return "none";
    }
    
    // Verify that the recipe still exists in recipes list
    if (recipesLoaded && recipes.length > 0) {
      const recipeExists = recipes.some(r => r.id === value);
      if (!recipeExists) {
        // Recipe was deleted, return "none"
        return "none";
      }
    }
    
    return value;
  };

  const toggleMealType = (mealTypeId: string) => {
    setSelectedMealTypes(prev => 
      prev.includes(mealTypeId)
        ? prev.filter(id => id !== mealTypeId)
        : [...prev, mealTypeId]
    );
  };

  const exportMealPlan = () => {
    if (!plan) return;

    const daysCount = getDaysCount();
    const activeMealTypes = getActiveMealTypes();
    const startDate = new Date(formData.start_date);

    const doc = new jsPDF();
    const sanitizeText = (text: string) =>
      text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Header with green primary color
    doc.setFillColor(22, 163, 74); // green primary color
    doc.rect(0, 0, 210, 40, "F");
    
    // MealMaster Logo/Brand
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("MealMaster", 105, 13, { align: "center" });
    
    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(sanitizeText(formData.name || "Jedalny plan"), 105, 22, { align: "center" });
    
    // Subtitle
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(
      sanitizeText(formData.plan_type === "weekly" ? "Tyzdnovy plan" : "Mesacny plan"),
      105,
      29,
      { align: "center" }
    );
    
    // Period
    doc.setFontSize(9);
    doc.text(
      sanitizeText(
        `Obdobie: ${format(startDate, "dd.MM.yyyy")} - ${format(
          addDays(startDate, daysCount - 1),
          "dd.MM.yyyy"
        )}`
      ),
      105,
      35,
      { align: "center" }
    );

    // Prepare table data
    const tableData: any[] = [];
    
    // Slovak day names (sanitized)
    const dayNames: Record<string, string> = {
      "pondelok": "Pondelok",
      "utorok": "Utorok",
      "streda": "Streda",
      "štvrtok": "Stvrtok",
      "piatok": "Piatok",
      "sobota": "Sobota",
      "nedeľa": "Nedela"
    };
    
    // Slovak meal type names (sanitized)
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
      const dayName = dayNames[dayNameSk] || format(currentDate, "EEEE");
      const dateStr = format(currentDate, "dd.MM.yyyy");
      
      const meals: string[] = [];
      activeMealTypes.forEach(mealType => {
        const mealLabel = mealTypeLabels[mealType] || mealType;
        const recipeId = getMealForDay(day, mealType);
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

    // Add table
    autoTable(doc, {
      startY: 45,
      head: [[sanitizeText("Datum"), sanitizeText("Den"), sanitizeText("Jedla")]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [22, 163, 74], // green primary color
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: "bold",
        halign: "center"
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 5
      },
      columnStyles: {
        0: { cellWidth: 30, halign: "center" },
        1: { cellWidth: 35, halign: "center" },
        2: { cellWidth: 125, halign: "left" }
      },
      alternateRowStyles: {
        fillColor: [245, 245, 250]
      }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(
        sanitizeText(`Strana ${i} z ${pageCount}`),
        105,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    }

    // Save PDF
    doc.save(
      `mealplan-${sanitizeText(formData.name || "plan")
        .toLowerCase()
        .replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`
    );

    toast({
      title: "Export hotovy",
      description: "Jedalnicky boli exportovane do PDF.",
    });
  };

  const renderMealPlan = () => {
    if (!plan) return null;

    const daysCount = getDaysCount();
    const activeMealTypes = getActiveMealTypes();

    // Don't render until recipes are loaded
    if (!recipesLoaded) {
      return (
        <div className="space-y-4">
          <h3 className="font-semibold">Plánovanie jedál</h3>
          <div className="text-center py-8 text-muted-foreground">
            Načítavam recepty...
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="font-semibold">Plánovanie jedál</h3>
        <div className="space-y-4">
          {Array.from({ length: daysCount }).map((_, dayIndex) => {
            const dayDate = addDays(new Date(formData.start_date), dayIndex);
            const dayName = format(dayDate, "EEEE", { locale: sk });
            const dayLabel = capitalize(dayName);
            const dateStr = format(dayDate, "dd.MM.yyyy");

            return (
              <Card key={dayIndex}>
                <CardContent className="p-4">
                  <div className="mb-4 pb-3 border-b">
                    <Label className="text-base font-semibold block mb-1">
                      {dayLabel}
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {dateStr}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeMealTypes.map((mealType) => {
                      const mealOption = MEAL_TYPE_OPTIONS.find(opt => opt.id === mealType);
                      const currentValue = getMealForDay(dayIndex + 1, mealType);
                      const selectedRecipe = recipes.find(r => r.id === currentValue);
                      const popoverKey = `${mealType}_${dayIndex}`;
                      const isOpen = openPopovers[popoverKey] || false;

                      return (
                        <div key={mealType} className="space-y-2">
                          <Label className="text-sm font-medium">
                            {mealOption?.label || mealType}
                          </Label>
                          <Popover 
                            open={isOpen} 
                            onOpenChange={(open) => {
                              setOpenPopovers(prev => ({ ...prev, [popoverKey]: open }));
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isOpen}
                                className="w-full justify-between text-sm font-normal"
                              >
                                <span className="truncate">
                                  {selectedRecipe ? selectedRecipe.name : currentValue === "none" ? "Žiadne" : "Vyberte recept..."}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Hľadať recept..." className="h-9" />
                                <CommandList>
                                  <CommandEmpty>Nenašli sa žiadne recepty.</CommandEmpty>
                                  <CommandGroup>
                                    <CommandItem
                                      value="none"
                                      onSelect={() => {
                                        setMealForDay(dayIndex + 1, mealType, null);
                                        setOpenPopovers(prev => ({ ...prev, [popoverKey]: false }));
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          currentValue === "none" ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      Žiadne
                                    </CommandItem>
                                    {recipes.map((recipe) => (
                                      <CommandItem
                                        key={recipe.id}
                                        value={recipe.name}
                                        onSelect={() => {
                                          setMealForDay(dayIndex + 1, mealType, recipe.id);
                                          setOpenPopovers(prev => ({ ...prev, [popoverKey]: false }));
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            currentValue === recipe.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        <span className="whitespace-normal break-words">{recipe.name}</span>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? "Upraviť jedálniček" : "Nový jedálniček"}</DialogTitle>
          <DialogDescription>
            {plan ? "Upravte detaily jedálnička" : "Vytvorte nový jedálniček"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Názov *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan_type">Typ plánu *</Label>
            <Select
              value={formData.plan_type}
              onValueChange={(value) => setFormData({ ...formData, plan_type: value })}
              disabled={!!plan}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Týždenný (7 dní)</SelectItem>
                <SelectItem value="monthly">Mesačný (30 dní)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Typy jedál *</Label>
            <div className="grid grid-cols-2 gap-3">
              {MEAL_TYPE_OPTIONS.map((mealType) => (
                <div key={mealType.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={mealType.id}
                    checked={selectedMealTypes.includes(mealType.id)}
                    onCheckedChange={() => toggleMealType(mealType.id)}
                    disabled={!!plan}
                  />
                  <Label
                    htmlFor={mealType.id}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {mealType.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_date">Dátum začiatku *</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
          </div>

          {plan && renderMealPlan()}

          <div className="flex gap-2 justify-between">
            <div className="flex gap-2">
              {plan && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={exportMealPlan}
                    disabled={loading}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportovať
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
              {loading ? "Ukladám..." : plan ? "Uložiť" : "Vytvoriť"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MealPlanDialog;
