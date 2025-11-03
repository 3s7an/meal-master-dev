import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addDays, format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

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
  { id: "desiata", label: "Desiata" },
  { id: "polievka", label: "Polievka" },
  { id: "hlavne_jedlo", label: "Hlavné jedlo" },
  { id: "dezert", label: "Dezert" },
  { id: "vecera", label: "Večera" },
];

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
  const [formData, setFormData] = useState({
    name: "",
    plan_type: "weekly",
    start_date: new Date().toISOString().split("T")[0],
  });
  const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>(["ranajky", "hlavne_jedlo", "vecera"]);
  const [planData, setPlanData] = useState<any>({});

  useEffect(() => {
    if (open) {
      fetchRecipes();
      if (plan) {
        setFormData({
          name: plan.name,
          plan_type: plan.plan_type,
          start_date: plan.start_date,
        });
        setSelectedMealTypes(plan.plan_data?.meal_types || ["ranajky", "hlavne_jedlo", "vecera"]);
        setPlanData(plan.plan_data || {});
      } else {
        resetForm();
      }
    }
  }, [plan, open]);

  const resetForm = () => {
    setFormData({
      name: "",
      plan_type: "weekly",
      start_date: new Date().toISOString().split("T")[0],
    });
    setSelectedMealTypes(["ranajky", "hlavne_jedlo", "vecera"]);
    setPlanData({});
  };

  const fetchRecipes = async () => {
    const { data } = await supabase
      .from("recipes")
      .select("id, name, category")
      .order("name");
    setRecipes(data || []);
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

    const mealPlanData = {
      user_id: user.id,
      name: formData.name,
      plan_type: formData.plan_type,
      meals_per_day: selectedMealTypes.length,
      start_date: formData.start_date,
      plan_data: { ...planData, meal_types: selectedMealTypes },
    };

    let error;
    if (plan) {
      ({ error } = await supabase
        .from("meal_plans")
        .update(mealPlanData)
        .eq("id", plan.id));
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

    const { error } = await supabase.from("meal_plans").delete().eq("id", plan.id);

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
    return selectedMealTypes;
  };

  const setMealForDay = (day: number, mealType: string, recipeId: string | null) => {
    const key = `day_${day}_${mealType}`;
    setPlanData((prev: any) => ({
      ...prev,
      [key]: recipeId,
    }));
  };

  const getMealForDay = (day: number, mealType: string): string => {
    const key = `day_${day}_${mealType}`;
    return planData[key] || "none";
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

    let exportText = `${formData.name}\n`;
    exportText += `${formData.plan_type === "weekly" ? "Týždenný plán" : "Mesačný plán"}\n`;
    exportText += `Obdobie: ${format(startDate, "dd.MM.yyyy")} - ${format(addDays(startDate, daysCount - 1), "dd.MM.yyyy")}\n`;
    exportText += `\n${"=".repeat(60)}\n\n`;

    for (let day = 1; day <= daysCount; day++) {
      const currentDate = addDays(startDate, day - 1);
      const dayName = format(currentDate, "EEEE", { locale: undefined });
      
      exportText += `Deň ${day} - ${format(currentDate, "dd.MM.yyyy")} (${dayName})\n`;
      exportText += `${"-".repeat(60)}\n`;

      activeMealTypes.forEach(mealType => {
        const mealOption = MEAL_TYPE_OPTIONS.find(opt => opt.id === mealType);
        const mealLabel = mealOption?.label || mealType;
        const recipeId = getMealForDay(day, mealType);
        const recipe = recipes.find(r => r.id === recipeId);
        const recipeName = recipe ? recipe.name : "Nenaplánované";

        exportText += `  ${mealLabel}: ${recipeName}\n`;
      });

      exportText += `\n`;
    }

    const blob = new Blob([exportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jedalnicek-${formData.name.toLowerCase().replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export úspešný",
      description: "Jedálniček bol exportovaný do súboru.",
    });
  };

  const renderMealPlan = () => {
    if (!plan) return null;

    const daysCount = getDaysCount();
    const activeMealTypes = getActiveMealTypes();

    return (
      <div className="space-y-4">
        <h3 className="font-semibold">Plánovanie jedál</h3>
        <div className="space-y-3">
          {activeMealTypes.map((mealType) => {
            const mealOption = MEAL_TYPE_OPTIONS.find(opt => opt.id === mealType);
            return (
              <Card key={mealType}>
                <CardContent className="p-4">
                  <Label className="mb-2 block font-medium">
                    {mealOption?.label || mealType}
                  </Label>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: daysCount }).map((_, dayIndex) => (
                      <div key={dayIndex} className="space-y-1">
                        <Label className="text-xs">{dayIndex + 1}</Label>
                        <Select
                          value={getMealForDay(dayIndex + 1, mealType)}
                          onValueChange={(value) => setMealForDay(dayIndex + 1, mealType, value === "none" ? null : value)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="-" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Žiadne</SelectItem>
                            {recipes.map((recipe) => (
                              <SelectItem key={recipe.id} value={recipe.id}>
                                {recipe.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
