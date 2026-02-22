import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Download, CheckSquare, Square, X, Search } from "lucide-react";
import { useShoppingList } from "@/hooks/useShoppingList";

const ShoppingList = () => {
  const {
    items,
    loading,
    newItem,
    setNewItem,
    isAuthenticated,
    selectionMode,
    setSelectionMode,
    selectedItems,
    searchTerm,
    setSearchTerm,
    filteredItems,
    addItem,
    toggleItem,
    deleteItem,
    clearChecked,
    toggleSelection,
    selectAll,
    deselectAll,
    deleteSelected,
    exitSelectionMode,
    exportList,
  } = useShoppingList();

  const itemsToCheck = searchTerm ? filteredItems : items;
  const allSelected = itemsToCheck.length > 0 && itemsToCheck.every(item => selectedItems.has(item.id));

  const handleToggleSelectAll = () => {
    if (allSelected) {
      deselectAll();
    } else {
      selectAll();
    }
  };

  return (
    <div className="space-y-8">
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
              {selectionMode
                ? `Režim výberu: ${selectedItems.size} ${selectedItems.size === 1 ? "položka vybraná" : selectedItems.size < 5 ? "položky vybrané" : "položiek vybraných"}`
                : "Spravujte položky na nákup"}
            </p>
          </div>
          {isAuthenticated && !selectionMode && (
            <div className="hidden md:flex flex-col gap-2">
              <Button variant="outline" onClick={exportList} disabled={items.length === 0} className="bg-background/90 hover:bg-background text-foreground shadow-lg">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                onClick={clearChecked}
                disabled={!items.some(i => i.is_checked)}
                className="bg-background/90 hover:bg-background text-foreground shadow-lg"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Vymazať nakúpené
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectionMode(true)}
                disabled={items.length === 0}
                className="bg-background/90 hover:bg-background text-foreground shadow-lg"
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                Vybrať
              </Button>
            </div>
          )}
          {isAuthenticated && selectionMode && (
            <div className="hidden md:flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={handleToggleSelectAll}
                className="bg-background/90 hover:bg-background text-foreground shadow-lg"
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
                onClick={deleteSelected}
                disabled={selectedItems.size === 0}
                className="shadow-lg"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Vymazať ({selectedItems.size})
              </Button>
              <Button variant="outline" onClick={exitSelectionMode} className="bg-background/90 hover:bg-background text-foreground shadow-lg">
                <X className="w-4 h-4 mr-2" />
                Zrušiť
              </Button>
            </div>
          )}
        </div>
      </div>

      {isAuthenticated && (
        <div className="md:hidden">
          {selectionMode ? (
            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={handleToggleSelectAll} className="w-full">
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
                onClick={deleteSelected}
                disabled={selectedItems.size === 0}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Vymazať ({selectedItems.size})
              </Button>
              <Button variant="outline" onClick={exitSelectionMode} className="w-full">
                <X className="w-4 h-4 mr-2" />
                Zrušiť
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={exportList} disabled={items.length === 0} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                onClick={clearChecked}
                disabled={!items.some(i => i.is_checked)}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Vymazať nakúpené
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectionMode(true)}
                disabled={items.length === 0}
                className="w-full"
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                Vybrať
              </Button>
            </div>
          )}
        </div>
      )}

      {isAuthenticated && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Pridať položku</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Názov položky"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  onKeyPress={(e) => e.key === "Enter" && addItem()}
                  className="flex-1 min-w-0"
                />
                <Button onClick={addItem} size="icon" className="shrink-0">
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
          {items.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Hľadať položky..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!isAuthenticated ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">Musíte byť prihlásený, aby ste mohli zobraziť nákupný zoznam.</p>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Načítavam zoznam...</p>
        </div>
      ) : items.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">Váš nákupný zoznam je prázdny</p>
          </CardContent>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">Nenašli sa žiadne položky zodpovedajúce vyhľadávaniu</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className={`transition-all duration-300 ease-in-out ${
                selectionMode && selectedItems.has(item.id)
                  ? "border-primary bg-primary/5"
                  : item.is_checked && !selectionMode
                    ? "opacity-75"
                    : ""
              }`}
            >
              <CardContent className="flex items-center gap-4 p-4">
                {selectionMode ? (
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={() => toggleSelection(item.id)}
                  />
                ) : (
                  <Checkbox
                    checked={item.is_checked}
                    onCheckedChange={(checked) => toggleItem(item.id, !!checked)}
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
                      {item.unit
                        ? `(${item.unit})`
                        : item.quantity != null
                          ? `(${item.quantity})`
                          : ""}
                    </span>
                  )}
                </div>
                {!selectionMode && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShoppingList;
