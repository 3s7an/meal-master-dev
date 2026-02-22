import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { shoppingItemSchema } from "@/lib/validations";

export interface ShoppingItem {
  id: string;
  item_name: string;
  quantity: number | null;
  unit: string | null;
  is_checked: boolean;
  recipe_id?: string;
}

export function useShoppingList() {
  const { toast } = useToast();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({ name: "" });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchItems();
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
    if (!user) {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setItems([]);
      return;
    }

    const { data, error } = await supabase
      .from("shopping_list")
      .select("*")
      .eq("user_id", user.id)
      .order("is_checked", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Chyba",
        description: "Nepodarilo sa načítať nákupný zoznam.",
        variant: "destructive",
      });
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const addItem = async () => {
    const validation = shoppingItemSchema.safeParse({ item_name: newItem.name });
    if (!validation.success) {
      toast({
        title: "Chyba",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("shopping_list").insert({
      user_id: user.id,
      item_name: newItem.name.trim(),
      quantity: null,
      unit: null,
      is_checked: false,
    });

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setNewItem({ name: "" });
      fetchItems();
    }
  };

  const toggleItem = async (id: string, is_checked: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("shopping_list")
      .update({ is_checked })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    } else {
      fetchItems();
    }
  };

  const deleteItem = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("shopping_list")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    } else {
      fetchItems();
    }
  };

  const clearChecked = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const checkedIds = items.filter(i => i.is_checked).map(i => i.id);
    if (checkedIds.length === 0) return;

    const { error } = await supabase
      .from("shopping_list")
      .delete()
      .in("id", checkedIds)
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Vymazané",
        description: "Nakúpené položky boli odstránené.",
      });
      fetchItems();
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        item.item_name.toLowerCase().includes(searchLower) ||
        (item.unit && item.unit.toLowerCase().includes(searchLower)) ||
        (item.quantity != null && item.quantity.toString().includes(searchLower))
      );
    });
  }, [items, searchTerm]);

  const selectAll = () => {
    const itemsToSelect = searchTerm ? filteredItems : items;
    setSelectedItems(new Set(itemsToSelect.map(item => item.id)));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const deleteSelected = async () => {
    if (selectedItems.size === 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("shopping_list")
      .delete()
      .in("id", Array.from(selectedItems))
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Vymazané",
        description: `Bolo odstránených ${selectedItems.size} položiek.`,
      });
      setSelectedItems(new Set());
      setSelectionMode(false);
      fetchItems();
    }
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedItems(new Set());
  };

  const exportList = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const uncheckedItems = items.filter(i => !i.is_checked);

    if (uncheckedItems.length === 0) {
      toast({
        title: "Zoznam je prázdny",
        description: "Nemáte žiadne položky na export.",
      });
      return;
    }

    try {
      const pdfDoc = await PDFDocument.create();
      const form = pdfDoc.getForm();

      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const sanitizeText = (text: string) =>
        text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      const centerText = (targetPage: { getSize: () => { width: number } }, text: string, font: { widthOfTextAtSize: (t: string, s: number) => number }, fontSize: number) => {
        const { width } = targetPage.getSize();
        const sanitizedText = sanitizeText(text);
        const textWidth = font.widthOfTextAtSize(sanitizedText, fontSize);
        return (width - textWidth) / 2;
      };

      const drawHeader = (targetPage: any) => {
        const { width, height } = targetPage.getSize();

        targetPage.drawRectangle({
          x: 0,
          y: height - 60,
          width,
          height: 60,
          color: rgb(0.086, 0.639, 0.290),
        });

        const titleText = "Nakupny zoznam";
        targetPage.drawText(sanitizeText(titleText), {
          x: centerText(targetPage, titleText, helveticaBoldFont, 18),
          y: height - 30,
          size: 18,
          font: helveticaBoldFont,
          color: rgb(1, 1, 1),
        });

        const dateText = sanitizeText(`Vytvorene: ${new Date().toLocaleDateString("sk-SK")}`);
        targetPage.drawText(dateText, {
          x: centerText(targetPage, dateText, helveticaFont, 8),
          y: height - 58,
          size: 8,
          font: helveticaFont,
          color: rgb(1, 1, 1),
        });

        return height - 90;
      };

      const addFooter = (targetPage: any, index: number, total: number) => {
        const instructionText = "Tip: Odsktnite polozky kliknutim na checkboxy. Na mobile pouzite Adobe Acrobat Reader pre plnu funkcnost.";
        targetPage.drawText(sanitizeText(instructionText), {
          x: centerText(targetPage, instructionText, helveticaFont, 7),
          y: 30,
          size: 7,
          font: helveticaFont,
          color: rgb(0.4, 0.4, 0.4),
        });

        const pageText = `Strana ${index + 1} z ${total}`;
        targetPage.drawText(sanitizeText(pageText), {
          x: centerText(targetPage, pageText, helveticaFont, 8),
          y: 15,
          size: 8,
          font: helveticaFont,
          color: rgb(0.4, 0.4, 0.4),
        });
      };

      let currentPage = pdfDoc.addPage([595, 842]);
      let currentY = drawHeader(currentPage);
      let currentPageIndex = 0;

      const bottomMargin = 100;
      const checkboxSize = 35;
      const textSpacing = 25;
      const itemFontSize = 18;
      const textLineHeight = itemFontSize + 10;
      const rowSpacing = 30;
      const horizontalMargin = 60;

      const wrapText = (text: string, maxWidth: number, fontRef: { widthOfTextAtSize: (t: string, s: number) => number }, fontSize: number) => {
        const words = text.split(" ");
        const lines: string[] = [];
        let currentLine = "";

        const pushCurrentLine = () => {
          if (currentLine.trim().length > 0) {
            lines.push(currentLine.trim());
            currentLine = "";
          }
        };

        words.forEach((word) => {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = fontRef.widthOfTextAtSize(testLine, fontSize);

          if (testWidth <= maxWidth) {
            currentLine = testLine;
          } else {
            pushCurrentLine();
            let partial = "";
            for (const char of word) {
              const testPartial = partial + char;
              if (fontRef.widthOfTextAtSize(testPartial, fontSize) <= maxWidth) {
                partial = testPartial;
              } else {
                if (partial.length > 0) {
                  lines.push(partial);
                }
                partial = char;
              }
            }
            currentLine = partial;
          }
        });

        pushCurrentLine();
        return lines.length > 0 ? lines : [text];
      };

      let { width: pageWidth } = currentPage.getSize();

      uncheckedItems.forEach((item, index) => {
        if (currentY < bottomMargin) {
          currentPage = pdfDoc.addPage([595, 842]);
          currentY = drawHeader(currentPage);
          ({ width: pageWidth } = currentPage.getSize());
          currentPageIndex++;
        }

        let maxTextWidth = pageWidth - 2 * horizontalMargin - checkboxSize - textSpacing;
        if (maxTextWidth < 120) {
          maxTextWidth = pageWidth - checkboxSize - textSpacing - 40;
        }

        const quantityText = item.quantity != null && item.unit
          ? `${item.quantity} ${item.unit}`.trim()
          : item.unit || "";

        const itemTextRaw = quantityText
          ? `${item.item_name} (${quantityText})`
          : item.item_name;
        const itemText = sanitizeText(itemTextRaw);

        const wrappedLines = wrapText(itemText, maxTextWidth, helveticaFont, itemFontSize);
        const textBlockHeight = wrappedLines.length * textLineHeight;

        const contentHeight = Math.max(checkboxSize, textBlockHeight);
        const requiredHeight = contentHeight + rowSpacing;

        if (currentY - requiredHeight < bottomMargin) {
          currentPage = pdfDoc.addPage([595, 842]);
          currentY = drawHeader(currentPage);
          ({ width: pageWidth } = currentPage.getSize());

          maxTextWidth = pageWidth - 2 * horizontalMargin - checkboxSize - textSpacing;
          if (maxTextWidth < 120) {
            maxTextWidth = pageWidth - checkboxSize - textSpacing - 40;
          }
        }

        const checkboxXPos = horizontalMargin;
        const textXPos = checkboxXPos + checkboxSize + textSpacing;

        const checkboxOffsetY = contentHeight > checkboxSize ? (contentHeight - checkboxSize) / 2 : 0;
        const textOffsetY = contentHeight > textBlockHeight ? (contentHeight - textBlockHeight) / 2 : 0;

        const topY = currentY;
        const checkboxY = topY - checkboxOffsetY - checkboxSize;

        const checkboxName = `item_${currentPageIndex}_${index}`;
        const checkbox = form.createCheckBox(checkboxName);

        checkbox.addToPage(currentPage, {
          x: checkboxXPos,
          y: checkboxY,
          width: checkboxSize,
          height: checkboxSize,
        });

        checkbox.uncheck();

        const textBaseline = topY - textOffsetY - itemFontSize;
        wrappedLines.forEach((line, lineIndex) => {
          currentPage.drawText(line, {
            x: textXPos,
            y: textBaseline - textLineHeight * lineIndex,
            size: itemFontSize,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
        });

        currentY = topY - contentHeight - rowSpacing;
      });

      const totalPages = pdfDoc.getPageCount();
      for (let i = 0; i < totalPages; i++) {
        const page = pdfDoc.getPage(i);
        addFooter(page, i, totalPages);
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nakupny-zoznam-${new Date().toISOString().split("T")[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export úspešný",
        description: "Nákupný zoznam bol exportovaný do PDF súboru s interaktívnymi checkboxmi.",
      });
    } catch (error) {
      console.error("Error creating PDF:", error);
      toast({
        title: "Chyba",
        description: "Nepodarilo sa vytvoriť PDF súbor.",
        variant: "destructive",
      });
    }
  };

  return {
    items,
    loading,
    newItem,
    setNewItem,
    isAuthenticated,
    selectionMode,
    setSelectionMode,
    selectedItems,
    searchTerm,
    setSearchTerm,
    filteredItems,
    addItem,
    toggleItem,
    deleteItem,
    clearChecked,
    toggleSelection,
    selectAll,
    deselectAll,
    deleteSelected,
    exitSelectionMode,
    exportList,
  };
}
