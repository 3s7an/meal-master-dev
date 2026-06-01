import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { shoppingItemSchema } from "@/lib/validations";
import {
  deleteShoppingListItem,
  deleteShoppingListItemsByIds,
  insertShoppingListItem,
  updateShoppingListItemChecked,
} from "../api/shoppingListRepository";
import { exportShoppingListPdf } from "../services/shoppingListExportService";
import type { ShoppingItem } from "@/types/shoppingList";

interface UseShoppingListMutationsOptions {
  userId: string | undefined;
  items: ShoppingItem[];
  refetch: () => Promise<void>;
  selectedItems: Set<string>;
  clearSelection: () => void;
  exitSelectionMode: () => void;
}

export function useShoppingListMutations({
  userId,
  items,
  refetch,
  selectedItems,
  clearSelection,
  exitSelectionMode,
}: UseShoppingListMutationsOptions) {
  const { toast } = useToast();
  const [newItem, setNewItem] = useState({ name: "" });

  const addItem = async () => {
    const validation = shoppingItemSchema.safeParse({ item_name: newItem.name });
    if (!validation.success) {
      toast({
        title: "Chyba",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    if (!userId) return;

    const { error } = await insertShoppingListItem({
      user_id: userId,
      item_name: newItem.name.trim(),
      quantity: null,
      unit: null,
      is_checked: false,
    });

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setNewItem({ name: "" });
    await refetch();
  };

  const toggleItem = async (itemId: string, isChecked: boolean) => {
    if (!userId) return;

    const { error } = await updateShoppingListItemChecked(itemId, userId, isChecked);

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    await refetch();
  };

  const deleteItem = async (itemId: string) => {
    if (!userId) return;

    const { error } = await deleteShoppingListItem(itemId, userId);

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    await refetch();
  };

  const clearChecked = async () => {
    if (!userId) return;

    const checkedIds = items.filter((item) => item.is_checked).map((item) => item.id);
    if (checkedIds.length === 0) return;

    const { error } = await deleteShoppingListItemsByIds(checkedIds, userId);

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Vymazané",
      description: "Nakúpené položky boli odstránené.",
    });
    await refetch();
  };

  const deleteSelected = async () => {
    if (selectedItems.size === 0 || !userId) return;

    const { error } = await deleteShoppingListItemsByIds(Array.from(selectedItems), userId);

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Vymazané",
      description: `Bolo odstránených ${selectedItems.size} položiek.`,
    });
    clearSelection();
    exitSelectionMode();
    await refetch();
  };

  const exportList = async () => {
    if (!userId) return;

    try {
      const result = await exportShoppingListPdf(items);

      if (result.warning === "empty") {
        toast({
          title: "Zoznam je prázdny",
          description: "Nemáte žiadne položky na export.",
        });
        return;
      }

      toast({
        title: "Export úspešný",
        description: "Nákupný zoznam bol exportovaný do PDF súboru s interaktívnymi checkboxmi.",
      });
    } catch (error) {
      console.error("Error creating PDF:", error);
      toast({
        title: "Chyba",
        description: "Nepodarilo sa vytvoriť PDF súbor.",
        variant: "destructive",
      });
    }
  };

  return {
    newItem,
    setNewItem,
    addItem,
    toggleItem,
    deleteItem,
    clearChecked,
    deleteSelected,
    exportList,
  };
}
