export const MEAL_TYPE_OPTIONS = [
  { id: "ranajky", label: "Raňajky" },
  { id: "snack", label: "Snack" },
  { id: "polievka", label: "Polievka" },
  { id: "hlavne_jedlo", label: "Hlavné jedlo" },
  { id: "vecera", label: "Večera" },
] as const;

export const DEFAULT_MEAL_TYPES = ["ranajky", "snack", "polievka", "hlavne_jedlo", "vecera"];

export const FALLBACK_MEAL_TYPES = DEFAULT_MEAL_TYPES;
