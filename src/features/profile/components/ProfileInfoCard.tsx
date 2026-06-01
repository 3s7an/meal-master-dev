import { format } from "date-fns";
import { Edit2, Mail, Save, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserProfile } from "@/types/profile";

interface ProfileInfoCardProps {
  profile: UserProfile;
  userEmail: string;
  isEditing: boolean;
  editedName: string;
  saving: boolean;
  onEditedNameChange: (name: string) => void;
  onStartEditing: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export function ProfileInfoCard({
  profile,
  userEmail,
  isEditing,
  editedName,
  saving,
  onEditedNameChange,
  onStartEditing,
  onCancel,
  onSave,
}: ProfileInfoCardProps) {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Profilové informácie</CardTitle>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={onStartEditing} className="gap-2">
              <Edit2 className="w-4 h-4" />
              Upraviť
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
                <X className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={onSave} disabled={saving} className="gap-2">
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
            <h3 className="text-xl font-semibold">{profile.full_name || "Používateľ"}</h3>
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
                onChange={(e) => onEditedNameChange(e.target.value)}
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
  );
}
