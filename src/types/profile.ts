export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface ProfileStats {
  ownRecipes: number;
  savedRecipes: number;
  mealPlans: number;
}
