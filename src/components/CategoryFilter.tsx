import { CATEGORY_OPTIONS, getCategoryImagePath } from "@/constants/categories";

interface CategoryFilterProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="flex gap-4 flex-wrap items-center justify-center">
      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        className="flex flex-col items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
      >
        <div
          className={`w-14 h-14 rounded-full overflow-hidden transition-all ${
            selectedCategory === null
              ? "ring-2 ring-primary ring-offset-2 shadow-lg scale-110"
              : "ring-1 ring-border/50 shadow-md hover:shadow-lg hover:ring-primary/50"
          }`}
        >
          <img
            src="/images/category_mini/feed_all.png"
            alt="Všetky"
            className="w-full h-full object-cover"
          />
        </div>
        <span
          className={`text-sm font-medium transition-all ${
            selectedCategory === null ? "text-primary font-semibold" : "text-muted-foreground"
          }`}
        >
          Všetky
        </span>
      </button>
      {CATEGORY_OPTIONS.map((cat) => (
        <button
          key={cat.value}
          type="button"
          onClick={() => onSelectCategory(cat.value)}
          className="flex flex-col items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
        >
          <div
            className={`w-14 h-14 rounded-full overflow-hidden transition-all ${
              selectedCategory === cat.value
                ? "ring-2 ring-primary ring-offset-2 shadow-lg scale-110"
                : "ring-1 ring-border/50 shadow-md hover:shadow-lg hover:ring-primary/50"
            }`}
          >
            <img
              src={getCategoryImagePath(cat.value)}
              alt={cat.label}
              className="w-full h-full object-cover"
            />
          </div>
          <span
            className={`text-sm font-medium transition-all ${
              selectedCategory === cat.value
                ? "text-primary font-semibold"
                : "text-muted-foreground"
            }`}
          >
            {cat.label}
          </span>
        </button>
      ))}
    </div>
  );
}
