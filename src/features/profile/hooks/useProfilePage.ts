import { useProfileData } from "./useProfileData";
import { useProfileEditor } from "./useProfileEditor";

export function useProfilePage() {
  const { profile, setProfile, stats, userEmail, loading } = useProfileData();
  const editor = useProfileEditor({ profile, setProfile });

  return {
    profile,
    stats,
    userEmail,
    loading,
    isEditing: editor.isEditing,
    editedName: editor.editedName,
    setEditedName: editor.setEditedName,
    saving: editor.saving,
    startEditing: editor.startEditing,
    handleCancel: editor.handleCancel,
    handleSave: editor.handleSave,
  };
}
