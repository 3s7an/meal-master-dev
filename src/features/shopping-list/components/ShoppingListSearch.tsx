import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ShoppingListSearchProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
}

export function ShoppingListSearch({ searchTerm, onSearchTermChange }: ShoppingListSearchProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Hľadať položky..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardContent>
    </Card>
  );
}
