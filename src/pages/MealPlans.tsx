import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar as CalendarIcon, Trash2, Edit, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MealPlanDialog from "@/components/MealPlanDialog";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
    // Fetch recipes
    const { data: recipesData } = await supabase
      .from("recipes")
      .select("id, name")
      .order("name");

    const recipes: Recipe[] = recipesData || [];

    const daysCount = plan.plan_type === "weekly" ? 7 : 30;
    const activeMealTypes = plan.plan_data?.meal_types || ["ranajky", "hlavne_jedlo", "vecera"];
    const startDate = new Date(plan.start_date);
    const planData = plan.plan_data || {};

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
    doc.text(sanitizeText(plan.name || "Jedalny plan"), 105, 22, { align: "center" });
    
    // Subtitle
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(
      sanitizeText(plan.plan_type === "weekly" ? "Tyzdnovy plan" : "Mesacny plan"),
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
      "ranajky": "Ranajky",
      "desiata": "Desiata",
      "polievka": "Polievka",
      "hlavne_jedlo": "Hlavne jedlo",
      "dezert": "Dezert",
      "vecera": "Vecera"
    };
    
    for (let day = 1; day <= daysCount; day++) {
      const currentDate = addDays(startDate, day - 1);
      const dayNameSk = format(currentDate, "EEEE", { locale: sk }).toLowerCase();
      const dayName = dayNames[dayNameSk] || format(currentDate, "EEEE");
      const dateStr = format(currentDate, "dd.MM.yyyy");
      
      const meals: string[] = [];
      activeMealTypes.forEach((mealType: string) => {
        const mealLabel = mealTypeLabels[mealType] || mealType;
        const key = `day_${day}_${mealType}`;
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
      `mealplan-${sanitizeText(plan.name || "plan")
        .toLowerCase()
        .replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`
    );

    toast({
      title: "Export hotovy",
      description: "Jedalnicek bol exportovany do PDF.",
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Jedálničky</h1>
          <p className="text-muted-foreground">Plánujte svoje stravovanie</p>
        </div>
        {isAuthenticated && (
          <Button onClick={handleCreatePlan} className="gap-2">
            <Plus className="w-4 h-4" />
            Nový plán
          </Button>
        )}
      </div>

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