import {
  createProfile,
  fetchMealPlansCount,
  fetchOwnRecipesCount,
  fetchProfile,
  fetchSavedRecipesCount,
} from "../api/profileRepository";
import type { ProfileStats, UserProfile } from "@/types/profile";

export async function getProfileForUser(userId: string, email: string | undefined) {
  const { data: profileData, error: profileError } = await fetchProfile(userId);

  if (profileError && profileError.code !== "PGRST116") {
    return { profile: null, stats: null, error: profileError };
  }

  let profile: UserProfile | null = profileData as UserProfile | null;

  if (!profile) {
    const defaultName = email?.split("@")[0] || "Používateľ";
    const { data: newProfile, error: createError } = await createProfile(userId, defaultName);

    if (createError) {
      return { profile: null, stats: null, error: createError };
    }

    profile = newProfile as UserProfile;
  }

  const [recipesResult, savedResult, plansResult] = await Promise.all([
    fetchOwnRecipesCount(userId),
    fetchSavedRecipesCount(userId),
    fetchMealPlansCount(userId),
  ]);

  const stats: ProfileStats = {
    ownRecipes: recipesResult.count || 0,
    savedRecipes: savedResult.count || 0,
    mealPlans: plansResult.count || 0,
  };

  return { profile, stats, error: null };
}
