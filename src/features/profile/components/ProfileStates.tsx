import { Card, CardContent } from "@/components/ui/card";

interface ProfileLoadingStateProps {
  message?: string;
}

export function ProfileLoadingState({ message = "Načítavam profil..." }: ProfileLoadingStateProps) {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

export function ProfileErrorState() {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <p className="text-muted-foreground">Nepodarilo sa načítať profil.</p>
      </CardContent>
    </Card>
  );
}
