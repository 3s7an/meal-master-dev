import { fetchShoppingListItems } from "../api/shoppingListRepository";
import type { ShoppingItem } from "@/types/shoppingList";

export async function getShoppingListForUser(userId: string) {
  const { data, error } = await fetchShoppingListItems(userId);

  return {
    items: (data ?? []) as ShoppingItem[],
    error,
  };
}
