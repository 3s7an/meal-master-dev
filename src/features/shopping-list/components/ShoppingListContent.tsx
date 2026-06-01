import {
  CheckSquare,
  Download,
  Plus,
  Search,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { ShoppingItem } from "@/types/shoppingList";

interface ShoppingListBannerProps {
  isAuthenticated: boolean;
  selectionMode: boolean;
  selectedCount: number;
  itemsCount: number;
  hasCheckedItems: boolean;
  allSelected: boolean;
  onExport: () => void;
  onClearChecked: () => void;
  onEnterSelectionMode: () => void;
  onToggleSelectAll: () => void;
  onDeleteSelected: () => void;
  onExitSelectionMode: () => void;
}

function SelectionActions({
  allSelected,
  selectedCount,
  onToggleSelectAll,
  onDeleteSelected,
  onExitSelectionMode,
  className,
}: {
  allSelected: boolean;
  selectedCount: number;
  onToggleSelectAll: () => void;
  onDeleteSelected: () => void;
  onExitSelectionMode: () => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <Button
        variant="outline"
        onClick={onToggleSelectAll}
        className="bg-background/90 hover:bg-background text-foreground shadow-lg w-full md:w-auto"
      >
        {allSelected ? (
          <>
            <Square className="w-4 h-4 mr-2" />
            Zrušiť výber
          </>
        ) : (
          <>
            <CheckSquare className="w-4 h-4 mr-2" />
            Vybrať všetko
          </>
        )}
      </Button>
      <Button
        variant="destructive"
        onClick={onDeleteSelected}
        disabled={selectedCount === 0}
        className="shadow-lg w-full md:w-auto"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Vymazať ({selectedCount})
      </Button>
      <Button
        variant="outline"
        onClick={onExitSelectionMode}
        className="bg-background/90 hover:bg-background text-foreground shadow-lg w-full md:w-auto"
      >
        <X className="w-4 h-4 mr-2" />
        Zrušiť
      </Button>
    </div>
  );
}

function DefaultActions({
  itemsCount,
  hasCheckedItems,
  onExport,
  onClearChecked,
  onEnterSelectionMode,
  className,
}: {
  itemsCount: number;
  hasCheckedItems: boolean;
  onExport: () => void;
  onClearChecked: () => void;
  onEnterSelectionMode: () => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <Button
        variant="outline"
        onClick={onExport}
        disabled={itemsCount === 0}
        className="bg-background/90 hover:bg-background text-foreground shadow-lg w-full md:w-auto"
      >
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>
      <Button
        variant="outline"
        onClick={onClearChecked}
        disabled={!hasCheckedItems}
        className="bg-background/90 hover:bg-background text-foreground shadow-lg w-full md:w-auto"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Vymazať nakúpené
      </Button>
      <Button
        variant="outline"
        onClick={onEnterSelectionMode}
        disabled={itemsCount === 0}
        className="bg-background/90 hover:bg-background text-foreground shadow-lg w-full md:w-auto"
      >
        <CheckSquare className="w-4 h-4 mr-2" />
        Vybrať
      </Button>
    </div>
  );
}

export function ShoppingListBanner({
  isAuthenticated,
  selectionMode,
  selectedCount,
  itemsCount,
  hasCheckedItems,
  allSelected,
  onExport,
  onClearChecked,
  onEnterSelectionMode,
  onToggleSelectAll,
  onDeleteSelected,
  onExitSelectionMode,
}: ShoppingListBannerProps) {
  const subtitle = selectionMode
    ? `Režim výberu: ${selectedCount} ${
        selectedCount === 1
          ? "položka vybraná"
          : selectedCount < 5
            ? "položky vybrané"
            : "položiek vybraných"
      }`
    : "Spravujte položky na nákup";

  return (
    <>
      <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl group">
        <div className="relative h-64 md:h-80 lg:h-96">
          <img
            src="/images/section_masks/nakupny_zoznam_baner.png"
            alt="Nákupný zoznam"
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
                Nákupný zoznam
              </h1>
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-20 bg-white rounded-full" />
                <div className="h-1.5 w-12 bg-white/70 rounded-full" />
              </div>
            </div>
            <p className="text-lg md:text-xl lg:text-2xl text-white/95 font-medium drop-shadow-lg max-w-xl leading-relaxed">
              {subtitle}
            </p>
          </div>

          {isAuthenticated && !selectionMode && (
            <DefaultActions
              itemsCount={itemsCount}
              hasCheckedItems={hasCheckedItems}
              onExport={onExport}
              onClearChecked={onClearChecked}
              onEnterSelectionMode={onEnterSelectionMode}
              className="hidden md:flex flex-col gap-2"
            />
          )}

          {isAuthenticated && selectionMode && (
            <SelectionActions
              allSelected={allSelected}
              selectedCount={selectedCount}
              onToggleSelectAll={onToggleSelectAll}
              onDeleteSelected={onDeleteSelected}
              onExitSelectionMode={onExitSelectionMode}
              className="hidden md:flex flex-col gap-2"
            />
          )}
        </div>
      </div>

      {isAuthenticated && (
        <div className="md:hidden">
          {selectionMode ? (
            <SelectionActions
              allSelected={allSelected}
              selectedCount={selectedCount}
              onToggleSelectAll={onToggleSelectAll}
              onDeleteSelected={onDeleteSelected}
              onExitSelectionMode={onExitSelectionMode}
              className="flex flex-col gap-2"
            />
          ) : (
            <DefaultActions
              itemsCount={itemsCount}
              hasCheckedItems={hasCheckedItems}
              onExport={onExport}
              onClearChecked={onClearChecked}
              onEnterSelectionMode={onEnterSelectionMode}
              className="flex flex-col gap-2"
            />
          )}
        </div>
      )}
    </>
  );
}

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
