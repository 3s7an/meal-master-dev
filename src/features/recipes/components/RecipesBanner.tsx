import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface RecipesBannerProps {
  onAddNew: () => void;
}

export function RecipesBanner({ onAddNew }: RecipesBannerProps) {
  return (
    <>
      <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl group">
        <div className="relative h-64 md:h-80 lg:h-96">
          <img
            src="/images/section_masks/recepty_baner.png"
            alt="Moje recepty"
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
                Moje recepty
              </h1>
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-20 bg-white rounded-full" />
                <div className="h-1.5 w-12 bg-white/70 rounded-full" />
              </div>
            </div>
            <p className="text-lg md:text-xl lg:text-2xl text-white/95 font-medium drop-shadow-lg max-w-xl leading-relaxed">
              Spravujte svoje obľúbené recepty
            </p>
          </div>
          <div className="hidden md:block">
            <Button
              onClick={onAddNew}
              size="lg"
              className="gap-2 bg-background/90 hover:bg-background text-foreground shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Nový recept
            </Button>
          </div>
        </div>
      </div>

      <div className="md:hidden">
        <Button onClick={onAddNew} size="lg" className="gap-2 w-full">
          <Plus className="w-5 h-5" />
          Nový recept
        </Button>
      </div>
    </>
  );
}
