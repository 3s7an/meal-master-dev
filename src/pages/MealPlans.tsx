import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar as CalendarIcon, Trash2, Edit, Download, ShoppingCart } from "lucide-react";
import MealPlanDialog from "@/components/MealPlanDialog";
import { useMealPlans } from "@/hooks/useMealPlans";

const MealPlans = () => {
  const {
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
  } = useMealPlans();

  return (
    <div className="space-y-8">
      <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl group">
        <div className="relative h-64 md:h-80 lg:h-96">
          <img
            src="/images/section_masks/jedalny_listok_baner.png"
            alt="Jedálničky"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>

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
