import { supabase } from "@/integrations/supabase/client";
import type { ShoppingItemInsertPayload } from "@/types/shoppingList";

export async function fetchShoppingListItems(userId: string) {
  return supabase
    .from("shopping_list")
    .select("*")
    .eq("user_id", userId)
    .order("is_checked", { ascending: true })
    .order("created_at", { ascending: false });
}

export async function insertShoppingListItem(payload: ShoppingItemInsertPayload) {
  return supabase.from("shopping_list").insert(payload);
}

export async function updateShoppingListItemChecked(
  itemId: string,
  userId: string,
  isChecked: boolean,
) {
  return supabase
    .from("shopping_list")
    .update({ is_checked: isChecked })
    .eq("id", itemId)
    .eq("user_id", userId);
}

export async function deleteShoppingListItem(itemId: string, userId: string) {
  return supabase.from("shopping_list").delete().eq("id", itemId).eq("user_id", userId);
}

export async function deleteShoppingListItemsByIds(itemIds: string[], userId: string) {
  if (itemIds.length === 0) {
    return { error: null };
  }

  return supabase.from("shopping_list").delete().in("id", itemIds).eq("user_id", userId);
}
