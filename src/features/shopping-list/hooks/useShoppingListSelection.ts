import { useState } from "react";
import type { ShoppingItem } from "@/types/shoppingList";

interface UseShoppingListSelectionOptions {
  items: ShoppingItem[];
  filteredItems: ShoppingItem[];
  searchTerm: string;
}

export function useShoppingListSelection({
  items,
  filteredItems,
  searchTerm,
}: UseShoppingListSelectionOptions) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const itemsToCheck = searchTerm ? filteredItems : items;
  const allSelected =
    itemsToCheck.length > 0 && itemsToCheck.every((item) => selectedItems.has(item.id));

  const toggleSelection = (id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedItems(new Set(itemsToCheck.map((item) => item.id)));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      deselectAll();
    } else {
      selectAll();
    }
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedItems(new Set());
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  return {
    selectionMode,
    setSelectionMode,
    selectedItems,
    allSelected,
    toggleSelection,
    selectAll,
    deselectAll,
    toggleSelectAll,
    exitSelectionMode,
    clearSelection,
  };
}
