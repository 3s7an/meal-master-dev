import { BookOpen, Bookmark, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProfileStats } from "@/types/profile";

interface ProfileStatsCardProps {
  stats: ProfileStats;
}

export function ProfileStatsCard({ stats }: ProfileStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Štatistiky</CardTitle>
        <CardDescription>Prehľad vašej aktivity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Vlastné recepty</p>
              <p className="text-xs text-muted-foreground">Vytvorené</p>
            </div>
          </div>
          <span className="text-2xl font-bold">{stats.ownRecipes}</span>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
          <div className="flex items-center gap-3">
            <Bookmark className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Uložené recepty</p>
              <p className="text-xs text-muted-foreground">Zozbierané</p>
            </div>
          </div>
          <span className="text-2xl font-bold">{stats.savedRecipes}</span>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Jedálne plány</p>
              <p className="text-xs text-muted-foreground">Vytvorené</p>
            </div>
          </div>
          <span className="text-2xl font-bold">{stats.mealPlans}</span>
        </div>
      </CardContent>
    </Card>
  );
}
