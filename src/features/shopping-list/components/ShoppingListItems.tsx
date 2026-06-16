import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { ShoppingItem } from "@/types/shoppingList";

interface ShoppingListItemRowProps {
  item: ShoppingItem;
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelection: (itemId: string) => void;
  onToggleChecked: (itemId: string, checked: boolean) => void;
  onDelete: (itemId: string) => void;
}

function ShoppingListItemRow({
  item,
  selectionMode,
  isSelected,
  onToggleSelection,
  onToggleChecked,
  onDelete,
}: ShoppingListItemRowProps) {
  return (
    <Card
      className={`transition-all duration-300 ease-in-out ${
        selectionMode && isSelected
          ? "border-primary bg-primary/5"
          : item.is_checked && !selectionMode
            ? "opacity-75"
            : ""
      }`}
    >
      <CardContent className="flex items-center gap-4 p-4">
        {selectionMode ? (
          <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelection(item.id)} />
        ) : (
          <Checkbox
            checked={item.is_checked}
            onCheckedChange={(checked) => onToggleChecked(item.id, !!checked)}
          />
        )}
        <div
          className={`flex-1 transition-all duration-300 ease-in-out ${
            item.is_checked && !selectionMode
              ? "line-through text-muted-foreground opacity-60"
              : "opacity-100"
          }`}
        >
          <span className="font-medium transition-all duration-300">{item.item_name}</span>
          {(item.quantity != null || item.unit) && (
            <span className="text-muted-foreground ml-2 transition-all duration-300">
              {item.unit ? `(${item.unit})` : item.quantity != null ? `(${item.quantity})` : ""}
            </span>
          )}
        </div>
        {!selectionMode && (
          <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface ShoppingListItemsProps {
  items: ShoppingItem[];
  filteredItems: ShoppingItem[];
  loading: boolean;
  isAuthenticated: boolean;
  selectionMode: boolean;
  selectedItems: Set<string>;
  onToggleSelection: (itemId: string) => void;
  onToggleChecked: (itemId: string, checked: boolean) => void;
  onDelete: (itemId: string) => void;
}

export function ShoppingListItems({
  items,
  filteredItems,
  loading,
  isAuthenticated,
  selectionMode,
  selectedItems,
  onToggleSelection,
  onToggleChecked,
  onDelete,
}: ShoppingListItemsProps) {
  if (!isAuthenticated) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-muted-foreground">
            Musíte byť prihlásený, aby ste mohli zobraziť nákupný zoznam.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Načítavam zoznam...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-muted-foreground">Váš nákupný zoznam je prázdny</p>
        </CardContent>
      </Card>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-muted-foreground">
            Nenašli sa žiadne položky zodpovedajúce vyhľadávaniu
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {filteredItems.map((item) => (
        <ShoppingListItemRow
          key={item.id}
          item={item}
          selectionMode={selectionMode}
          isSelected={selectedItems.has(item.id)}
          onToggleSelection={onToggleSelection}
          onToggleChecked={onToggleChecked}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
