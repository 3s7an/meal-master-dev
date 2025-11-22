import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, BookOpen, Bookmark, Calendar, Edit2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const Profile = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<{
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
  } | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [editedName, setEditedName] = useState<string>("");
  const [stats, setStats] = useState({
    ownRecipes: 0,
    savedRecipes: 0,
    mealPlans: 0,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      return;
    }

    setUserEmail(user.email || "");

    // Fetch profile
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      toast({
        title: "Chyba",
        description: "Nepodarilo sa načítať profil.",
        variant: "destructive",
      });
    } else if (profileData) {
      setProfile(profileData);
      setEditedName(profileData.full_name || "");
    } else {
      // Create profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({ id: user.id, full_name: user.email?.split("@")[0] || "Používateľ" })
        .select()
        .single();

      if (createError) {
        toast({
          title: "Chyba",
          description: "Nepodarilo sa vytvoriť profil.",
          variant: "destructive",
        });
      } else if (newProfile) {
        setProfile(newProfile);
        setEditedName(newProfile.full_name || "");
      }
    }

    // Fetch statistics
    const [recipesResult, savedResult, plansResult] = await Promise.all([
      supabase
        .from("recipes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("saved_recipes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("meal_plans")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

    setStats({
      ownRecipes: recipesResult.count || 0,
      savedRecipes: savedResult.count || 0,
      mealPlans: plansResult.count || 0,
    });

    setLoading(false);
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: editedName.trim() || null })
      .eq("id", profile.id);

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setProfile({ ...profile, full_name: editedName.trim() || null });
      setIsEditing(false);
      toast({
        title: "Profil aktualizovaný",
        description: "Vaše meno bolo úspešne aktualizované.",
      });
    }

    setSaving(false);
  };

  const handleCancel = () => {
    setEditedName(profile?.full_name || "");
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Načítavam profil...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-muted-foreground">Nepodarilo sa načítať profil.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Môj profil</h1>
        <p className="text-muted-foreground">Spravujte svoje údaje a prehliadajte štatistiky</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Profilové informácie</CardTitle>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Upraviť
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Ukladám..." : "Uložiť"}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || "Profil"}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-primary-foreground" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  {profile.full_name || "Používateľ"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Člen od {format(new Date(profile.created_at), "d.M.yyyy")}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Meno</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Zadajte svoje meno"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{profile.full_name || "Nezadané"}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{userEmail}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle>Štatistiky</CardTitle>
            <CardDescription>Prehľad vašej aktivity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Vlastné recepty</p>
                  <p className="text-xs text-muted-foreground">Vytvorené</p>
                </div>
              </div>
              <span className="text-2xl font-bold">{stats.ownRecipes}</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-3">
                <Bookmark className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Uložené recepty</p>
                  <p className="text-xs text-muted-foreground">Zozbierané</p>
                </div>
              </div>
              <span className="text-2xl font-bold">{stats.savedRecipes}</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Jedálne plány</p>
                  <p className="text-xs text-muted-foreground">Vytvorené</p>
                </div>
              </div>
              <span className="text-2xl font-bold">{stats.mealPlans}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;

