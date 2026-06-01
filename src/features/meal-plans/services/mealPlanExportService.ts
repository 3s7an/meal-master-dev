import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { addDays, format } from "date-fns";
import { sk } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { fetchRecipeNames } from "../api/mealPlansRepository";
import { FALLBACK_MEAL_TYPES } from "../lib/mealPlanConstants";
import {
  capitalize,
  getActiveMealTypes,
  getDaysCount,
  migratePlanDataKeys,
  normalizeMealType,
  normalizeMealTypes,
} from "../lib/mealPlanUtils";
import type { MealPlan, MealPlanData, MealPlanRecipeOption } from "@/types/mealPlan";

const DAY_NAMES: Record<string, string> = {
  pondelok: "Pondelok",
  utorok: "Utorok",
  streda: "Streda",
  "štvrtok": "Stvrtok",
  piatok: "Piatok",
  sobota: "Sobota",
  "nedeľa": "Nedela",
};

const MEAL_TYPE_LABELS: Record<string, string> = {
  ranajky: "Raňajky",
  snack: "Snack",
  polievka: "Polievka",
  hlavne_jedlo: "Hlavne jedlo",
  vecera: "Večera",
  desiata: "Snack",
  dezert: "Snack",
};

const sanitizeText = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export async function exportSavedMealPlanPdf(plan: MealPlan) {
  const { data: recipesData } = await fetchRecipeNames();
  const recipes = recipesData ?? [];

  const daysCount = getDaysCount(plan.plan_type);
  const normalizedMealTypes = normalizeMealTypes(plan.plan_data?.meal_types || FALLBACK_MEAL_TYPES);
  const activeMealTypes = FALLBACK_MEAL_TYPES.filter((type) => normalizedMealTypes.includes(type));
  const startDate = new Date(plan.start_date);
  const planData = migratePlanDataKeys(plan.plan_data || {});

  const pdfDoc = await PDFDocument.create();
  const width = 595;
  const height = 842;

  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const centerText = (
    text: string,
    font: { widthOfTextAtSize: (t: string, s: number) => number },
    fontSize: number,
  ) => {
    const textWidth = font.widthOfTextAtSize(sanitizeText(text), fontSize);
    return (width - textWidth) / 2;
  };

  const drawHeader = async (page: ReturnType<PDFDocument["addPage"]>) => {
    page.drawRectangle({
      x: 0,
      y: height - 50,
      width,
      height: 50,
      color: rgb(1, 1, 1),
    });

    const planTypeText = sanitizeText(plan.plan_type === "weekly" ? "Tyzdnovy plan" : "Mesacny plan");
    page.drawText(planTypeText, {
      x: centerText(planTypeText, helveticaFont, 11),
      y: height - 25,
      size: 11,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    const periodText = sanitizeText(
      `Obdobie: ${format(startDate, "dd.MM.yyyy")} - ${format(
        addDays(startDate, daysCount - 1),
        "dd.MM.yyyy",
      )}`,
    );
    page.drawText(periodText, {
      x: centerText(periodText, helveticaFont, 11),
      y: height - 40,
      size: 11,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
  };

  const tableData: string[][] = [];

  for (let day = 1; day <= daysCount; day++) {
    const currentDate = addDays(startDate, day - 1);
    const dayNameSk = format(currentDate, "EEEE", { locale: sk }).toLowerCase();
    const fallbackDayName = format(currentDate, "EEEE", { locale: sk });
    const dayName = DAY_NAMES[dayNameSk] || capitalize(fallbackDayName);
    const dateStr = format(currentDate, "dd.MM.yyyy");

    const meals: string[] = [];
    activeMealTypes.forEach((mealType) => {
      const normalizedMealType = normalizeMealType(mealType);
      const mealLabel = MEAL_TYPE_LABELS[normalizedMealType] || normalizedMealType;
      const key = `day_${day}_${normalizedMealType}`;
      const recipeId = planData[key];
      const recipe = recipes.find((r) => r.id === recipeId);
      const recipeName = recipe ? recipe.name : "Neplanovane";
      meals.push(`${sanitizeText(mealLabel)}: ${sanitizeText(recipeName)}`);
    });

    tableData.push([sanitizeText(dateStr), sanitizeText(dayName), sanitizeText(meals.join("\n"))]);
  }

  let currentPage = pdfDoc.addPage([595, 842]);
  await drawHeader(currentPage);

  const rowHeight = 35;
  const headerHeight = 20;
  const startY = height - 55;
  let currentY = startY;
  const bottomMargin = 50;

  currentPage.drawRectangle({
    x: 0,
    y: currentY - headerHeight,
    width,
    height: headerHeight,
    color: rgb(0.086, 0.639, 0.29),
  });

  const headers = ["Datum", "Den", "Jedla"];
  const colWidths = [90, 70, 435];
  let xPos = 0;
  headers.forEach((header, idx) => {
    currentPage.drawText(sanitizeText(header), {
      x: xPos + (idx === 2 ? 5 : colWidths[idx] / 2 - 10),
      y: currentY - 13,
      size: 11,
      font: helveticaBoldFont,
      color: rgb(1, 1, 1),
    });
    xPos += colWidths[idx];
  });

  currentY -= headerHeight;

  for (let rowIdx = 0; rowIdx < tableData.length; rowIdx++) {
    const row = tableData[rowIdx];
    if (currentY < bottomMargin + rowHeight) {
      currentPage = pdfDoc.addPage([595, 842]);
      await drawHeader(currentPage);
      currentY = startY - headerHeight;

      currentPage.drawRectangle({
        x: 0,
        y: currentY,
        width,
        height: headerHeight,
        color: rgb(0.086, 0.639, 0.29),
      });
      xPos = 0;
      headers.forEach((header, idx) => {
        currentPage.drawText(sanitizeText(header), {
          x: xPos + (idx === 2 ? 5 : colWidths[idx] / 2 - 10),
          y: currentY + 7,
          size: 11,
          font: helveticaBoldFont,
          color: rgb(1, 1, 1),
        });
        xPos += colWidths[idx];
      });
      currentY -= headerHeight;
    }

    if (rowIdx % 2 === 0) {
      currentPage.drawRectangle({
        x: 0,
        y: currentY - rowHeight,
        width,
        height: rowHeight,
        color: rgb(0.96, 0.96, 0.98),
      });
    }

    xPos = 0;
    colWidths.forEach((colWidth) => {
      currentPage.drawLine({
        start: { x: xPos, y: currentY },
        end: { x: xPos, y: currentY - rowHeight },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });
      xPos += colWidth;
    });

    xPos = 0;
    row.forEach((cell, cellIdx) => {
      const lines = cell.split("\n");
      const lineSpacing = 12;
      const startYOffset = rowHeight / 2 - ((lines.length - 1) * lineSpacing) / 2;
      lines.forEach((line, lineIdx) => {
        currentPage.drawText(sanitizeText(line), {
          x: xPos + (cellIdx === 2 ? 5 : colWidths[cellIdx] / 2 - 10),
          y: currentY - startYOffset - lineIdx * lineSpacing,
          size: 9,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      });
      xPos += colWidths[cellIdx];
    });

    currentY -= rowHeight;
  }

  const lastPage = pdfDoc.getPage(pdfDoc.getPageCount() - 1);
  lastPage.drawLine({
    start: { x: 0, y: currentY },
    end: { x: width, y: currentY },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });

  const totalPages = pdfDoc.getPageCount();
  for (let i = 0; i < totalPages; i++) {
    const page = pdfDoc.getPage(i);
    const pageText = sanitizeText(`Strana ${i + 1} z ${totalPages}`);
    page.drawText(pageText, {
      x: centerText(pageText, helveticaFont, 8),
      y: 15,
      size: 8,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `mealplan-${sanitizeText(plan.name || "plan")
    .toLowerCase()
    .replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}

interface ExportEditorMealPlanPdfParams {
  name: string;
  planType: string;
  startDate: string;
  planData: MealPlanData;
  selectedMealTypes: string[];
  recipes: MealPlanRecipeOption[];
  getMealForDay: (day: number, mealType: string) => string;
}

export function exportEditorMealPlanPdf({
  name,
  planType,
  startDate,
  selectedMealTypes,
  recipes,
  getMealForDay,
}: ExportEditorMealPlanPdfParams) {
  const daysCount = getDaysCount(planType);
  const activeMealTypes = getActiveMealTypes(selectedMealTypes);
  const start = new Date(startDate);

  const doc = new jsPDF();

  doc.setFillColor(22, 163, 74);
  doc.rect(0, 0, 210, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("MealMaster", 105, 13, { align: "center" });

  doc.setFontSize(16);
  doc.text(sanitizeText(name || "Jedalny plan"), 105, 22, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(
    sanitizeText(planType === "weekly" ? "Tyzdnovy plan" : "Mesacny plan"),
    105,
    29,
    { align: "center" },
  );

  doc.setFontSize(9);
  doc.text(
    sanitizeText(
      `Obdobie: ${format(start, "dd.MM.yyyy")} - ${format(
        addDays(start, daysCount - 1),
        "dd.MM.yyyy",
      )}`,
    ),
    105,
    35,
    { align: "center" },
  );

  const tableData: string[][] = [];

  for (let day = 1; day <= daysCount; day++) {
    const currentDate = addDays(start, day - 1);
    const dayNameSk = format(currentDate, "EEEE", { locale: sk }).toLowerCase();
    const dayName = DAY_NAMES[dayNameSk] || format(currentDate, "EEEE");
    const dateStr = format(currentDate, "dd.MM.yyyy");

    const meals: string[] = [];
    activeMealTypes.forEach((mealType) => {
      const mealLabel = MEAL_TYPE_LABELS[mealType] || mealType;
      const recipeId = getMealForDay(day, mealType);
      const recipe = recipes.find((r) => r.id === recipeId);
      const recipeName = recipe ? recipe.name : "Neplanovane";
      meals.push(`${sanitizeText(mealLabel)}: ${sanitizeText(recipeName)}`);
    });

    tableData.push([sanitizeText(dateStr), sanitizeText(dayName), sanitizeText(meals.join("\n"))]);
  }

  autoTable(doc, {
    startY: 45,
    head: [[sanitizeText("Datum"), sanitizeText("Den"), sanitizeText("Jedla")]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [22, 163, 74],
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 5,
    },
    columnStyles: {
      0: { cellWidth: 30, halign: "center" },
      1: { cellWidth: 35, halign: "center" },
      2: { cellWidth: 125, halign: "left" },
    },
    alternateRowStyles: {
      fillColor: [245, 245, 250],
    },
  });

  const pageCount = (doc as jsPDF & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      sanitizeText(`Strana ${i} z ${pageCount}`),
      105,
      doc.internal.pageSize.height - 10,
      { align: "center" },
    );
  }

  doc.save(
    `mealplan-${sanitizeText(name || "plan")
      .toLowerCase()
      .replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`,
  );
}
