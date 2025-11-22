import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Download, CheckSquare, Square, X, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface ShoppingItem {
  id: string;
  item_name: string;
  quantity: number | null;
  unit: string | null;
  is_checked: boolean;
  recipe_id?: string;
}

const ShoppingList = () => {
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
    if (!newItem.name.trim()) return;

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

  const filteredItems = items.filter((item) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.item_name.toLowerCase().includes(searchLower) ||
      (item.unit && item.unit.toLowerCase().includes(searchLower)) ||
      (item.quantity && item.quantity.toString().includes(searchLower))
    );
  });

  const exportList = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Filter only unchecked items for export
    const uncheckedItems = items.filter(i => !i.is_checked);

    if (uncheckedItems.length === 0) {
      toast({
        title: "Zoznam je prázdny",
        description: "Nemáte žiadne položky na export.",
      });
      return;
    }

    try {
      // Create PDF document
      const pdfDoc = await PDFDocument.create();
      const form = pdfDoc.getForm();

      // Load fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Helper functions
      const sanitizeText = (text: string) =>
        text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      const centerText = (targetPage: any, text: string, font: any, fontSize: number) => {
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
          color: rgb(0.086, 0.639, 0.290), // #16a34a
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
        const { width } = targetPage.getSize();
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

      // Create first page with header
      let currentPage = pdfDoc.addPage([595, 842]);
      let currentY = drawHeader(currentPage);
      let currentPageIndex = 0;

      // Layout settings - optimized for mobile with much larger checkboxes
      const bottomMargin = 100;
      const checkboxSize = 35; // Much larger checkbox for mobile (35px for easy touch interaction)
      const textSpacing = 25; // Increased spacing between checkbox and text
      const itemFontSize = 18; // Larger font for readability
      const textLineHeight = itemFontSize + 10; // Line height for wrapped text
      const rowSpacing = 30; // Spacing between items
      const horizontalMargin = 60; // Horizontal margin for centered layout

      // Helper to wrap text within available width
      const wrapText = (text: string, maxWidth: number, fontRef: any, fontSize: number) => {
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
            // Handle words longer than max width by splitting characters
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

      // Draw items with checkboxes
      uncheckedItems.forEach((item, index) => {
        if (currentY < bottomMargin) {
          currentPage = pdfDoc.addPage([595, 842]);
          currentY = drawHeader(currentPage);
          ({ width: pageWidth } = currentPage.getSize());
          currentPageIndex++;
        }

        // Calculate available width for text
        let maxTextWidth = pageWidth - 2 * horizontalMargin - checkboxSize - textSpacing;
        if (maxTextWidth < 120) {
          maxTextWidth = pageWidth - checkboxSize - textSpacing - 40;
        }

        const quantityText = item.quantity && item.unit
          ? `${item.quantity} ${item.unit}`.trim()
          : item.unit || '';

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

        // Create checkbox with unique name for each page
        const checkboxName = `item_${currentPageIndex}_${index}`;
        const checkbox = form.createCheckBox(checkboxName);

        // Add checkbox with larger size for mobile (35px for easy touch interaction)
        checkbox.addToPage(currentPage, {
          x: checkboxXPos,
          y: checkboxY,
          width: checkboxSize,
          height: checkboxSize,
        });

        // Set checkbox as unchecked by default
        checkbox.uncheck();

        // Note: Chrome-native on mobile has very limited support for interactive PDF forms
        // For best results, users should use Adobe Acrobat Reader alebo podobné PDF aplikácie

        // Draw text with better spacing and alignment for mobile
        let textBaseline = topY - textOffsetY - itemFontSize;
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

      // Add footer to all pages
      const totalPages = pdfDoc.getPageCount();
      for (let i = 0; i < totalPages; i++) {
        const page = pdfDoc.getPage(i);
        addFooter(page, i, totalPages);
      }

      // Ensure form is properly configured for mobile
      // Note: Some mobile PDF viewers (especially Chrome-native) have limited support
      // for interactive forms. Users may need to use Adobe Acrobat Reader or similar apps
      
      // Save PDF
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

  return (
    <div className="space-y-8">
      {/* Banner Section */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl group">
        {/* Background Image */}
        <div className="relative h-64 md:h-80 lg:h-96">
          <img
            src="/images/section_masks/nakupny_zoznam_baner.png"
            alt="Nákupný zoznam"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50" />
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>
        
        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-center justify-between p-6 md:p-12 lg:p-16">
          <div className="max-w-2xl space-y-5 animate-in fade-in slide-in-from-left-5 duration-700">
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-2xl leading-tight">
                Nákupný zoznam
              </h1>
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-20 bg-white rounded-full" />
                <div className="h-1.5 w-12 bg-white/70 rounded-full" />
              </div>
            </div>
            <p className="text-lg md:text-xl lg:text-2xl text-white/95 font-medium drop-shadow-lg max-w-xl leading-relaxed">
              {selectionMode 
                ? `Režim výberu: ${selectedItems.size} ${selectedItems.size === 1 ? 'položka vybraná' : selectedItems.size < 5 ? 'položky vybrané' : 'položiek vybraných'}`
                : "Spravujte položky na nákup"
              }
            </p>
          </div>
          {isAuthenticated && !selectionMode && (
            <div className="hidden md:flex flex-col gap-2">
              <Button variant="outline" onClick={exportList} disabled={items.length === 0} className="bg-background/90 hover:bg-background text-foreground shadow-lg">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                onClick={clearChecked}
                disabled={!items.some(i => i.is_checked)}
                className="bg-background/90 hover:bg-background text-foreground shadow-lg"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Vymazať nakúpené
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectionMode(true)}
                disabled={items.length === 0}
                className="bg-background/90 hover:bg-background text-foreground shadow-lg"
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                Vybrať
              </Button>
            </div>
          )}
          {isAuthenticated && selectionMode && (
            <div className="hidden md:flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const itemsToCheck = searchTerm ? filteredItems : items;
                  const allSelected = itemsToCheck.length > 0 && itemsToCheck.every(item => selectedItems.has(item.id));
                  if (allSelected) {
                    deselectAll();
                  } else {
                    selectAll();
                  }
                }}
                className="bg-background/90 hover:bg-background text-foreground shadow-lg"
              >
                {(() => {
                  const itemsToCheck = searchTerm ? filteredItems : items;
                  const allSelected = itemsToCheck.length > 0 && itemsToCheck.every(item => selectedItems.has(item.id));
                  return allSelected;
                })() ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Zrušiť výber
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Vybrať všetko
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={deleteSelected}
                disabled={selectedItems.size === 0}
                className="shadow-lg"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Vymazať ({selectedItems.size})
              </Button>
              <Button variant="outline" onClick={exitSelectionMode} className="bg-background/90 hover:bg-background text-foreground shadow-lg">
                <X className="w-4 h-4 mr-2" />
                Zrušiť
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Action Buttons */}
      {isAuthenticated && (
        <div className="md:hidden">
          {selectionMode ? (
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const itemsToCheck = searchTerm ? filteredItems : items;
                  const allSelected = itemsToCheck.length > 0 && itemsToCheck.every(item => selectedItems.has(item.id));
                  if (allSelected) {
                    deselectAll();
                  } else {
                    selectAll();
                  }
                }}
                className="w-full"
              >
                {(() => {
                  const itemsToCheck = searchTerm ? filteredItems : items;
                  const allSelected = itemsToCheck.length > 0 && itemsToCheck.every(item => selectedItems.has(item.id));
                  return allSelected;
                })() ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Zrušiť výber
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Vybrať všetko
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={deleteSelected}
                disabled={selectedItems.size === 0}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Vymazať ({selectedItems.size})
              </Button>
              <Button variant="outline" onClick={exitSelectionMode} className="w-full">
                <X className="w-4 h-4 mr-2" />
                Zrušiť
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={exportList} disabled={items.length === 0} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                onClick={clearChecked}
                disabled={!items.some(i => i.is_checked)}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Vymazať nakúpené
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectionMode(true)}
                disabled={items.length === 0}
                className="w-full"
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                Vybrať
              </Button>
            </div>
          )}
        </div>
      )}

      {isAuthenticated && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Pridať položku</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Názov položky"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  onKeyPress={(e) => e.key === "Enter" && addItem()}
                  className="flex-1 min-w-0"
                />
                <Button onClick={addItem} size="icon" className="shrink-0">
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
          {items.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Hľadať položky..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!isAuthenticated ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">Musíte byť prihlásený, aby ste mohli zobraziť nákupný zoznam.</p>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Načítavam zoznam...</p>
        </div>
      ) : items.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">Váš nákupný zoznam je prázdny</p>
          </CardContent>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">Nenašli sa žiadne položky zodpovedajúce vyhľadávaniu</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <Card 
              key={item.id}
              className={`transition-all duration-300 ease-in-out ${
                selectionMode && selectedItems.has(item.id) 
                  ? "border-primary bg-primary/5" 
                  : item.is_checked && !selectionMode
                  ? "opacity-75"
                  : ""
              }`}
            >
              <CardContent className="flex items-center gap-4 p-4">
                {selectionMode ? (
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={() => toggleSelection(item.id)}
                  />
                ) : (
                  <Checkbox
                    checked={item.is_checked}
                    onCheckedChange={(checked) => toggleItem(item.id, !!checked)}
                  />
                )}
                <div 
                  className={`flex-1 transition-all duration-300 ease-in-out ${
                    item.is_checked && !selectionMode 
                      ? "line-through text-muted-foreground opacity-60" 
                      : "opacity-100"
                  }`}
                >
                  <span className="font-medium transition-all duration-300">{item.item_name}</span>
                  {(item.quantity || item.unit) && (
                    <span className="text-muted-foreground ml-2 transition-all duration-300">
                      {item.unit 
                        ? `(${item.unit})` 
                        : item.quantity 
                        ? `(${item.quantity})` 
                        : ""}
                    </span>
                  )}
                </div>
                {!selectionMode && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShoppingList;