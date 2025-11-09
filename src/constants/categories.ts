export type CategoryOption = {
  value: string;
  label: string;
  badgeClass: string;
};

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: "ranajky", label: "Raňajky", badgeClass: "bg-accent text-accent-foreground" },
  { value: "snack", label: "Snack", badgeClass: "bg-muted text-foreground" },
  { value: "polievka", label: "Polievka", badgeClass: "bg-primary/10 text-primary" },
  { value: "hlavne_jedlo", label: "Hlavné jedlo", badgeClass: "bg-secondary text-secondary-foreground" },
  { value: "vecera", label: "Večera", badgeClass: "bg-primary text-primary-foreground" },
];

export const DEFAULT_CATEGORY = CATEGORY_OPTIONS[0].value;

export const normalizeCategory = (value?: string | null): string => {
  const v = (value || "").toLowerCase();
  switch (v) {
    case "ranajky":
    case "breakfast":
      return "ranajky";
    case "snack":
    case "desiata":
    case "dezert":
    case "snacks":
      return "snack";
    case "polievka":
    case "soup":
      return "polievka";
    case "hlavne_jedlo":
    case "lunch":
    case "obed":
    case "main":
    case "main_course":
      return "hlavne_jedlo";
    case "vecera":
    case "dinner":
    case "supper":
      return "vecera";
    default:
      return DEFAULT_CATEGORY;
  }
};

export const getCategoryOption = (value?: string | null): CategoryOption => {
  const normalized = normalizeCategory(value);
  return CATEGORY_OPTIONS.find((option) => option.value === normalized) ?? CATEGORY_OPTIONS[0];
};

