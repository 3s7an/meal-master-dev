import { ProfileHeader } from "@/features/profile/components/ProfileHeader";
import { ProfileInfoCard } from "@/features/profile/components/ProfileInfoCard";
import { ProfileErrorState, ProfileLoadingState } from "@/features/profile/components/ProfileStates";
import { ProfileStatsCard } from "@/features/profile/components/ProfileStatsCard";
import { useProfilePage } from "@/features/profile/hooks/useProfilePage";

const Profile = () => {
  const {
    profile,
    stats,
    userEmail,
    loading,
    isEditing,
    editedName,
    setEditedName,
    saving,
    startEditing,
    handleCancel,
    handleSave,
  } = useProfilePage();

  if (loading) {
    return <ProfileLoadingState />;
  }

  if (!profile) {
    return <ProfileErrorState />;
  }

  return (
    <div className="space-y-8">
      <ProfileHeader />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ProfileInfoCard
          profile={profile}
          userEmail={userEmail}
          isEditing={isEditing}
          editedName={editedName}
          saving={saving}
          onEditedNameChange={setEditedName}
          onStartEditing={startEditing}
          onCancel={handleCancel}
          onSave={handleSave}
        />

        <ProfileStatsCard stats={stats} />
      </div>
    </div>
  );
};

export default Profile;
