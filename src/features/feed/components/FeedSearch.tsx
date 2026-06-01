import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface FeedSearchProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
}

export function FeedSearch({ searchTerm, onSearchTermChange }: FeedSearchProps) {
  return (
    <div className="relative max-w-md mx-auto w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <Input
        placeholder="Hľadať recepty..."
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}
