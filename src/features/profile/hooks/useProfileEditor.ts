import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useToast } from "@/hooks/use-toast";
import { updateProfile } from "../api/profileRepository";
import type { UserProfile } from "@/types/profile";

interface UseProfileEditorOptions {
  profile: UserProfile | null;
  setProfile: Dispatch<SetStateAction<UserProfile | null>>;
}

export function useProfileEditor({ profile, setProfile }: UseProfileEditorOptions) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditedName(profile?.full_name || "");
  }, [profile]);

  const startEditing = () => {
    setEditedName(profile?.full_name || "");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedName(profile?.full_name || "");
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);

    const trimmedName = editedName.trim() || null;
    const { error } = await updateProfile(profile.id, trimmedName);

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setProfile({ ...profile, full_name: trimmedName });
      setIsEditing(false);
      toast({
        title: "Profil aktualizovaný",
        description: "Vaše meno bolo úspešne aktualizované.",
      });
    }

    setSaving(false);
  };

  return {
    isEditing,
    editedName,
    setEditedName,
    saving,
    startEditing,
    handleCancel,
    handleSave,
  };
}
