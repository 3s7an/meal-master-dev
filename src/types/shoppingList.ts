export interface ShoppingItem {
  id: string;
  item_name: string;
  quantity: number | null;
  unit: string | null;
  is_checked: boolean;
  recipe_id?: string | null;
}

export interface ShoppingItemInsertPayload {
  user_id: string;
  item_name: string;
  quantity: number | null;
  unit: string | null;
  is_checked: boolean;
}
