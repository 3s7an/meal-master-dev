import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ShoppingListAddItemProps {
  newItemName: string;
  onNameChange: (name: string) => void;
  onAdd: () => void;
}

export function ShoppingListAddItem({ newItemName, onNameChange, onAdd }: ShoppingListAddItemProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pridať položku</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            placeholder="Názov položky"
            value={newItemName}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAdd()}
            className="flex-1 min-w-0"
          />
          <Button onClick={onAdd} size="icon" className="shrink-0">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
