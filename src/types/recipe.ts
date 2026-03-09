export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  category: string;
  ingredients: Ingredient[];
  instructions: string;
  image_url?: string;
  calories?: number;
  notes?: string;
  user_id?: string;
  is_public?: boolean;
  created_at?: string;
}

export type RecipeSource = "own" | "saved";

export interface UserRecipe extends Recipe {
  source: RecipeSource;
  saved_at?: string;
  author_name?: string | null;
}

export interface FeedRecipe extends Recipe {
  user_id: string;
  created_at: string;
  likes_count?: number;
  is_liked?: boolean;
  is_saved?: boolean;
  author_name?: string | null;
}
