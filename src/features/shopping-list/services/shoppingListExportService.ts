import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { ShoppingItem } from "@/types/shoppingList";

export async function exportShoppingListPdf(items: ShoppingItem[]) {
  const uncheckedItems = items.filter((item) => !item.is_checked);

  if (uncheckedItems.length === 0) {
    return { error: null, warning: "empty" as const };
  }

  const pdfDoc = await PDFDocument.create();
  const form = pdfDoc.getForm();

  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const sanitizeText = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const centerText = (
    targetPage: { getSize: () => { width: number } },
    text: string,
    font: { widthOfTextAtSize: (t: string, s: number) => number },
    fontSize: number,
  ) => {
    const { width } = targetPage.getSize();
    const sanitizedText = sanitizeText(text);
    const textWidth = font.widthOfTextAtSize(sanitizedText, fontSize);
    return (width - textWidth) / 2;
  };

  const drawHeader = (targetPage: ReturnType<PDFDocument["addPage"]>) => {
    const { width, height } = targetPage.getSize();

    targetPage.drawRectangle({
      x: 0,
      y: height - 60,
      width,
      height: 60,
      color: rgb(0.086, 0.639, 0.29),
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

  const addFooter = (
    targetPage: ReturnType<PDFDocument["addPage"]>,
    index: number,
    total: number,
  ) => {
    const instructionText =
      "Tip: Odsktnite polozky kliknutim na checkboxy. Na mobile pouzite Adobe Acrobat Reader pre plnu funkcnost.";
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

  const wrapText = (
    text: string,
    maxWidth: number,
    fontRef: { widthOfTextAtSize: (t: string, s: number) => number },
    fontSize: number,
  ) => {
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

    const quantityText =
      item.quantity != null && item.unit
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
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `nakupny-zoznam-${new Date().toISOString().split("T")[0]}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);

  return { error: null, warning: null };
}
