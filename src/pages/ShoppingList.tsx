import { ShoppingListBanner } from "@/features/shopping-list/components/ShoppingListBanner";
import { ShoppingListAddItem } from "@/features/shopping-list/components/ShoppingListAddItem";
import { ShoppingListSearch } from "@/features/shopping-list/components/ShoppingListSearch";
import { ShoppingListItems } from "@/features/shopping-list/components/ShoppingListItems";
import { useShoppingListPage } from "@/features/shopping-list/hooks/useShoppingListPage";

const ShoppingList = () => {
  const {
    items,
    loading,
    isAuthenticated,
    hasCheckedItems,
    searchTerm,
    setSearchTerm,
    filteredItems,
    selectionMode,
    setSelectionMode,
    selectedItems,
    allSelected,
    toggleSelectAll,
    toggleSelection,
    exitSelectionMode,
    newItem,
    setNewItem,
    addItem,
    toggleItem,
    deleteItem,
    clearChecked,
    deleteSelected,
    exportList,
  } = useShoppingListPage();

  return (
    <div className="space-y-8">
      <ShoppingListBanner
        isAuthenticated={isAuthenticated}
        selectionMode={selectionMode}
        selectedCount={selectedItems.size}
        itemsCount={items.length}
        hasCheckedItems={hasCheckedItems}
        allSelected={allSelected}
        onExport={exportList}
        onClearChecked={clearChecked}
        onEnterSelectionMode={() => setSelectionMode(true)}
        onToggleSelectAll={toggleSelectAll}
        onDeleteSelected={deleteSelected}
        onExitSelectionMode={exitSelectionMode}
      />

      {isAuthenticated && (
        <>
          <ShoppingListAddItem
            newItemName={newItem.name}
            onNameChange={(name) => setNewItem({ name })}
            onAdd={addItem}
          />
          {items.length > 0 && (
            <ShoppingListSearch searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />
          )}
        </>
      )}

      <ShoppingListItems
        items={items}
        filteredItems={filteredItems}
        loading={loading}
        isAuthenticated={isAuthenticated}
        selectionMode={selectionMode}
        selectedItems={selectedItems}
        onToggleSelection={toggleSelection}
        onToggleChecked={toggleItem}
        onDelete={deleteItem}
      />
    </div>
  );
};

export default ShoppingList;
