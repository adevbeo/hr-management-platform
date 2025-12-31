import { PDFDocument, StandardFonts } from "pdf-lib";
import { stripHtml } from "./contractTemplate";

export async function buildPdfFromHtml(title: string, html: string) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pageMargin = 50;
  let page = doc.addPage();
  let y = page.getHeight() - pageMargin;

  const lines = wrapText(stripHtml(html), 90);
  lines.unshift(title);

  for (const line of lines) {
    if (y < pageMargin) {
      page = doc.addPage();
      y = page.getHeight() - pageMargin;
    }
    page.drawText(line, { x: pageMargin, y, size: 12, font });
    y -= 16;
  }

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

export async function buildPdfFromRows(title: string, rows: Record<string, any>[]) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pageMargin = 50;
  let page = doc.addPage();
  let y = page.getHeight() - pageMargin;

  page.drawText(title, { x: pageMargin, y, size: 14, font });
  y -= 24;

  rows.forEach((row, idx) => {
    const text = Object.entries(row)
      .map(([k, v]) => `${k}: ${v ?? ""}`)
      .join(" | ");

    if (y < pageMargin) {
      page = doc.addPage();
      y = page.getHeight() - pageMargin;
    }

    page.drawText(`${idx + 1}. ${text}`, { x: pageMargin, y, size: 11, font });
    y -= 14;
  });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

function wrapText(text: string, maxChars: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      lines.push(current.trim());
      current = word;
    } else {
      current += ` ${word}`;
    }
  }

  if (current.trim().length) {
    lines.push(current.trim());
  }

  return lines;
}
