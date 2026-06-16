import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { uploadRecipeImage } from "../api/recipesRepository";

export function useRecipeImage() {
  const { toast } = useToast();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Chyba",
        description: "Prosím vyberte obrázok (JPG, PNG alebo WEBP).",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Chyba",
        description: "Obrázok je príliš veľký. Maximálna veľkosť je 5MB.",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Načíta existujúci URL pri otvorení receptu — zruší prípadný nový súbor
  const loadImage = (url: string | null) => {
    setImagePreview(url);
    setImageFile(null);
  };

  const uploadImage = async (userId: string, recipeId?: string): Promise<string | null> => {
    if (!imageFile) return null;

    setUploadingImage(true);
    try {
      const { publicUrl, error } = await uploadRecipeImage(userId, imageFile, recipeId);

      if (error) {
        if (
          error.message.includes("not found") ||
          error.message.includes("Bucket") ||
          error.message.includes("bucket")
        ) {
          toast({
            title: "Bucket neexistuje alebo nie je dostupný",
            description: `Bucket 'recipe-images' nebol nájdený. Skontrolujte: 1) Bucket je public, 2) RLS policies sú nastavené (Storage > Policies), 3) Ste prihlásený. Chyba: ${error.message}`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Chyba pri nahrávaní",
            description: error.message || "Nepodarilo sa nahrať obrázok.",
            variant: "destructive",
          });
        }
        return null;
      }

      return publicUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nepodarilo sa nahrať obrázok.";
      console.error("Upload error:", error);
      toast({
        title: "Chyba pri nahrávaní",
        description: message,
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  return {
    imageFile,
    imagePreview,
    uploadingImage,
    handleImageChange,
    removeImage,
    loadImage,
    uploadImage,
  };
}
