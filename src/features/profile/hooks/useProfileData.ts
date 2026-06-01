import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { ProfileStats, UserProfile } from "@/types/profile";
import { getProfileForUser } from "../services/profileService";

export function useProfileData() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    ownRecipes: 0,
    savedRecipes: 0,
    mealPlans: 0,
  });
  const [loading, setLoading] = useState(true);

  const userEmail = user?.email ?? "";

  const loadProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setStats({ ownRecipes: 0, savedRecipes: 0, mealPlans: 0 });
      setLoading(false);
      return;
    }

    setLoading(true);

    const { profile: nextProfile, stats: nextStats, error } = await getProfileForUser(
      user.id,
      user.email,
    );

    if (error) {
      toast({
        title: "Chyba",
        description: "Nepodarilo sa načítať profil.",
        variant: "destructive",
      });
      setProfile(null);
    } else if (nextProfile && nextStats) {
      setProfile(nextProfile);
      setStats(nextStats);
    }

    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    setProfile,
    stats,
    userEmail,
    loading,
    refetch: loadProfile,
  };
}
