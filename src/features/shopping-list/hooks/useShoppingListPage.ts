import { useAuth } from "@/contexts/AuthContext";
import { useShoppingListData } from "./useShoppingListData";
import { useShoppingListFilters } from "./useShoppingListFilters";
import { useShoppingListMutations } from "./useShoppingListMutations";
import { useShoppingListSelection } from "./useShoppingListSelection";

export function useShoppingListPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const isAuthenticated = !!user;

  const { items, loading, refetch } = useShoppingListData(userId);
  const filters = useShoppingListFilters(items);
  const selection = useShoppingListSelection({
    items,
    filteredItems: filters.filteredItems,
    searchTerm: filters.searchTerm,
  });

  const mutations = useShoppingListMutations({
    userId,
    items,
    refetch,
    selectedItems: selection.selectedItems,
    clearSelection: selection.clearSelection,
    exitSelectionMode: selection.exitSelectionMode,
  });

  const hasCheckedItems = items.some((item) => item.is_checked);

  return {
    items,
    loading,
    isAuthenticated,
    hasCheckedItems,
    searchTerm: filters.searchTerm,
    setSearchTerm: filters.setSearchTerm,
    filteredItems: filters.filteredItems,
    selectionMode: selection.selectionMode,
    setSelectionMode: selection.setSelectionMode,
    selectedItems: selection.selectedItems,
    allSelected: selection.allSelected,
    toggleSelectAll: selection.toggleSelectAll,
    toggleSelection: selection.toggleSelection,
    exitSelectionMode: selection.exitSelectionMode,
    newItem: mutations.newItem,
    setNewItem: mutations.setNewItem,
    addItem: mutations.addItem,
    toggleItem: mutations.toggleItem,
    deleteItem: mutations.deleteItem,
    clearChecked: mutations.clearChecked,
    deleteSelected: mutations.deleteSelected,
    exportList: mutations.exportList,
  };
}
