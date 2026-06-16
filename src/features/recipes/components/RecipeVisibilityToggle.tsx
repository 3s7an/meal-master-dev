import { Globe, Lock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface RecipeVisibilityToggleProps {
  isPublic: boolean;
  onChange: (checked: boolean) => void;
}

export function RecipeVisibilityToggle({ isPublic, onChange }: RecipeVisibilityToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
      <div className="flex items-center gap-3">
        {isPublic ? (
          <Globe className="w-5 h-5 text-primary" />
        ) : (
          <Lock className="w-5 h-5 text-muted-foreground" />
        )}
        <div>
          <Label htmlFor="is_public" className="cursor-pointer">
            {isPublic ? "Verejný recept" : "Súkromný recept"}
          </Label>
          <p className="text-sm text-muted-foreground">
            {isPublic ? "Recept uvidia všetci používatelia" : "Recept uvidíte len vy"}
          </p>
        </div>
      </div>
      <Switch id="is_public" checked={isPublic} onCheckedChange={onChange} />
    </div>
  );
}
