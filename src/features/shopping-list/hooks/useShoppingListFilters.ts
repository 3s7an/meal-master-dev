import { useMemo, useState } from "react";
import type { ShoppingItem } from "@/types/shoppingList";

export function useShoppingListFilters(items: ShoppingItem[]) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (!searchTerm) return true;

      const searchLower = searchTerm.toLowerCase();
      return (
        item.item_name.toLowerCase().includes(searchLower) ||
        (item.unit && item.unit.toLowerCase().includes(searchLower)) ||
        (item.quantity != null && item.quantity.toString().includes(searchLower))
      );
    });
  }, [items, searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    filteredItems,
  };
}
