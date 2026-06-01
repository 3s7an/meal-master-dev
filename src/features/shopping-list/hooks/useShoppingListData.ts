import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { ShoppingItem } from "@/types/shoppingList";
import { getShoppingListForUser } from "../services/shoppingListService";

export function useShoppingListData(userId: string | undefined) {
  const { toast } = useToast();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { items: nextItems, error } = await getShoppingListForUser(userId);

    if (error) {
      toast({
        title: "Chyba",
        description: "Nepodarilo sa načítať nákupný zoznam.",
        variant: "destructive",
      });
      setItems([]);
    } else {
      setItems(nextItems);
    }

    setLoading(false);
  }, [userId, toast]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return {
    items,
    setItems,
    loading,
    refetch: loadItems,
  };
}
