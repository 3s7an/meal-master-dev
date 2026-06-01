import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export async function fetchProfile(userId: string) {
  return supabase.from("profiles").select("*").eq("id", userId).single();
}

export async function createProfile(userId: string, fullName: string) {
  return supabase
    .from("profiles")
    .insert({ id: userId, full_name: fullName })
    .select()
    .single();
}

export async function updateProfile(userId: string, fullName: string | null) {
  return supabase.from("profiles").update({ full_name: fullName }).eq("id", userId);
}

export async function fetchOwnRecipesCount(userId: string) {
  return supabase
    .from("recipes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
}

export async function fetchSavedRecipesCount(userId: string) {
  return supabase
    .from("saved_recipes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
}

export async function fetchMealPlansCount(userId: string) {
  return supabase
    .from("meal_plans")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
}
