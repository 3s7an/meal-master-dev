import { Check, ChevronsUpDown, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { MEAL_TYPE_OPTIONS } from "../lib/mealPlanConstants";
import { useMealPlanForm } from "../hooks/useMealPlanForm";
import type { MealPlan } from "@/types/mealPlan";

interface MealPlanEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: MealPlan | null;
  onSuccess: () => void;
}

export function MealPlanEditorModal({ open, onOpenChange, plan, onSuccess }: MealPlanEditorModalProps) {
  const {
    loading,
    recipes,
    recipesLoaded,
    formData,
    setFormData,
    selectedMealTypes,
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
    isEditing,
  } = useMealPlanForm({
    plan,
    open,
    onSuccess,
    onClose: () => onOpenChange(false),
  });

  const renderMealPlan = () => {
    if (!isEditing) return null;

    if (!recipesLoaded) {
      return (
        <div className="space-y-4">
          <h3 className="font-semibold">Plánovanie jedál</h3>
          <div className="text-center py-8 text-muted-foreground">Načítavam recepty...</div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="font-semibold">Plánovanie jedál</h3>
        <div className="space-y-4">
          {mealPlanDays.map(({ dayIndex, dayNumber, dayLabel, dateStr }) => (
            <Card key={dayIndex}>
              <CardContent className="p-4">
                <div className="mb-4 pb-3 border-b">
                  <Label className="text-base font-semibold block mb-1">{dayLabel}</Label>
                  <span className="text-sm text-muted-foreground">{dateStr}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeMealTypes.map((mealType) => {
                    const mealOption = MEAL_TYPE_OPTIONS.find((opt) => opt.id === mealType);
                    const currentValue = getMealForDay(dayNumber, mealType);
                    const selectedRecipe = recipes.find((r) => r.id === currentValue);
                    const popoverKey = `${mealType}_${dayIndex}`;
                    const isPopoverOpen = openPopovers[popoverKey] || false;

                    return (
                      <div key={mealType} className="space-y-2">
                        <Label className="text-sm font-medium">
                          {mealOption?.label || mealType}
                        </Label>
                        <Popover
                          open={isPopoverOpen}
                          onOpenChange={(nextOpen) => {
                            setOpenPopovers((prev) => ({ ...prev, [popoverKey]: nextOpen }));
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={isPopoverOpen}
                              className="w-full justify-between text-sm font-normal"
                            >
                              <span className="truncate">
                                {selectedRecipe
                                  ? selectedRecipe.name
                                  : currentValue === "none"
                                    ? "Žiadne"
                                    : "Vyberte recept..."}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[var(--radix-popover-trigger-width)] p-0"
                            align="start"
                          >
                            <Command>
                              <CommandInput placeholder="Hľadať recept..." className="h-9" />
                              <CommandList>
                                <CommandEmpty>Nenašli sa žiadne recepty.</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    value="none"
                                    onSelect={() => {
                                      setMealForDay(dayNumber, mealType, null);
                                      setOpenPopovers((prev) => ({ ...prev, [popoverKey]: false }));
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        currentValue === "none" ? "opacity-100" : "opacity-0",
                                      )}
                                    />
                                    Žiadne
                                  </CommandItem>
                                  {recipes.map((recipe) => (
                                    <CommandItem
                                      key={recipe.id}
                                      value={recipe.name}
                                      onSelect={() => {
                                        setMealForDay(dayNumber, mealType, recipe.id);
                                        setOpenPopovers((prev) => ({ ...prev, [popoverKey]: false }));
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          currentValue === recipe.id ? "opacity-100" : "opacity-0",
                                        )}
                                      />
                                      <span className="whitespace-normal break-words">
                                        {recipe.name}
                                      </span>
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
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Upraviť jedálniček" : "Nový jedálniček"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Upravte detaily jedálnička" : "Vytvorte nový jedálniček"}
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
              disabled={isEditing}
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
                    disabled={isEditing}
                  />
                  <Label htmlFor={mealType.id} className="text-sm font-normal cursor-pointer">
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

          {renderMealPlan()}

          <div className="flex gap-2 justify-between">
            <div className="flex gap-2">
              {isEditing && (
                <>
                  <Button type="button" variant="outline" onClick={exportMealPlan} disabled={loading}>
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
              {loading ? "Ukladám..." : isEditing ? "Uložiť" : "Vytvoriť"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
