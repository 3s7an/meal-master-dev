import { Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RecipeImageUploadProps {
  imagePreview: string | null;
  imageFile: File | null;
  uploadingImage: boolean;
  loading: boolean;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
}

export function RecipeImageUpload({
  imagePreview,
  imageFile,
  uploadingImage,
  loading,
  onImageChange,
  onRemoveImage,
}: RecipeImageUploadProps) {
  const disabled = uploadingImage || loading;

  return (
    <div className="space-y-2">
      <Label htmlFor="image">Fotka receptu</Label>
      <div className="space-y-3">
        {imagePreview ? (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-64 md:h-80 object-cover rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={onRemoveImage}
              disabled={disabled}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">
              Kliknite alebo presuňte obrázok sem
            </p>
            <p className="text-xs text-muted-foreground">JPG, PNG alebo WEBP (max. 5MB)</p>
          </div>
        )}
        <div className="flex gap-2">
          <Input
            id="image"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={onImageChange}
            disabled={disabled}
            className="cursor-pointer"
          />
          {imagePreview && !imageFile && (
            <Button
              type="button"
              variant="outline"
              onClick={onRemoveImage}
              disabled={disabled}
            >
              <X className="w-4 h-4 mr-2" />
              Odstrániť
            </Button>
          )}
        </div>
        {uploadingImage && (
          <p className="text-sm text-muted-foreground">Nahrávam obrázok...</p>
        )}
      </div>
    </div>
  );
}
