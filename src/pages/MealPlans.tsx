import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MealPlan {
  id: string;
  name: string;
  plan_type: string;
  meals_per_day: number;
  start_date: string;
  plan_data: any;
}

const MealPlans = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("meal_plans")
      .select("*")
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

  const createPlan = async (planType: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("meal_plans").insert({
      user_id: user.id,
      name: `Nový ${planType === "weekly" ? "týždenný" : "mesačný"} plán`,
      plan_type: planType,
      meals_per_day: 3,
      start_date: new Date().toISOString().split("T")[0],
      plan_data: {},
    });

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Plán vytvorený",
        description: "Nový jedálniček bol vytvorený.",
      });
      fetchPlans();
    }
  };

  const deletePlan = async (id: string) => {
    const { error } = await supabase.from("meal_plans").delete().eq("id", id);

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Jedálničky</h1>
          <p className="text-muted-foreground">Plánujte svoje stravovanie</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => createPlan("weekly")} className="gap-2">
            <Plus className="w-4 h-4" />
            Týždenný plán
          </Button>
          <Button onClick={() => createPlan("monthly")} variant="secondary" className="gap-2">
            <Plus className="w-4 h-4" />
            Mesačný plán
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Načítavam jedálničky...</p>
        </div>
      ) : plans.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Zatiaľ nemáte žiadne jedálničky</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => createPlan("weekly")}>
                <Plus className="w-4 h-4 mr-2" />
                Vytvoriť týždenný plán
              </Button>
              <Button onClick={() => createPlan("monthly")} variant="secondary">
                <Plus className="w-4 h-4 mr-2" />
                Vytvoriť mesačný plán
              </Button>
            </div>
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
                <Button className="w-full" variant="outline">
                  Upraviť plán
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MealPlans;