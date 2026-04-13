import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { authOptions } from "@/lib/auth";
import { getStore } from "@/lib/data";
import type { Invoice } from "@/types/invoice";

function sanitizeFilePart(value: string): string {
  return value
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDateLabel(date: string | undefined): string {
  if (!date) return "NA";
  return date;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = getStore();
  const invoice = await store.get<Invoice>("invoices", params.id);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = height - 50;

  page.drawText("Mangalam Banquet Hall & Hotel", {
    x: 40,
    y,
    size: 16,
    font: fontBold,
    color: rgb(0.25, 0.1, 0.1),
  });
  y -= 22;

  page.drawText(invoice.invoiceType === "proforma" ? "PROFORMA INVOICE" : "TAX INVOICE", {
    x: 40,
    y,
    size: 12,
    font: fontBold,
  });

  y -= 26;
  page.drawText(`Invoice No: ${invoice.id}`, { x: 40, y, size: 10, font });
  y -= 16;
  page.drawText(`Invoice Date: ${invoice.invoiceDate}`, { x: 40, y, size: 10, font });
  y -= 16;
  page.drawText(`Booked For: ${invoice.bookedForDate || "-"}`, { x: 40, y, size: 10, font });
  y -= 16;
  page.drawText(`Booking Ref: ${invoice.bookingId}`, { x: 40, y, size: 10, font });
  y -= 16;
  page.drawText(`Customer: ${invoice.buyer.name}`, { x: 40, y, size: 10, font });
  y -= 16;
  page.drawText(`Phone: ${invoice.buyer.phone}`, { x: 40, y, size: 10, font });

  y -= 24;
  page.drawText("Line Items", { x: 40, y, size: 11, font: fontBold });
  y -= 16;

  page.drawText("Description", { x: 40, y, size: 9, font: fontBold });
  page.drawText("Qty", { x: 340, y, size: 9, font: fontBold });
  page.drawText("Rate", { x: 390, y, size: 9, font: fontBold });
  page.drawText("Total", { x: 470, y, size: 9, font: fontBold });
  y -= 10;

  page.drawLine({
    start: { x: 40, y },
    end: { x: width - 40, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  y -= 14;
  for (const item of invoice.lineItems.slice(0, 18)) {
    const desc = item.description.length > 55 ? `${item.description.slice(0, 55)}...` : item.description;
    page.drawText(desc, { x: 40, y, size: 9, font });
    page.drawText(String(item.qty), { x: 340, y, size: 9, font });
    page.drawText(item.rate.toFixed(2), { x: 390, y, size: 9, font });
    page.drawText(item.total.toFixed(2), { x: 470, y, size: 9, font });
    y -= 14;
    if (y < 130) break;
  }

  y -= 8;
  page.drawLine({
    start: { x: 40, y },
    end: { x: width - 40, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  y -= 18;
  page.drawText(`Subtotal: ₹${invoice.summary.subtotal.toFixed(2)}`, {
    x: 360,
    y,
    size: 10,
    font,
  });
  y -= 14;
  page.drawText(`CGST: ₹${invoice.summary.totalCGST.toFixed(2)}`, {
    x: 360,
    y,
    size: 10,
    font,
  });
  y -= 14;
  page.drawText(`SGST: ₹${invoice.summary.totalSGST.toFixed(2)}`, {
    x: 360,
    y,
    size: 10,
    font,
  });
  y -= 18;
  page.drawText(`Grand Total: ₹${invoice.summary.grandTotalRounded.toFixed(2)}`, {
    x: 330,
    y,
    size: 11,
    font: fontBold,
  });
  y -= 14;
  page.drawText(`Paid: ₹${invoice.totalPaid.toFixed(2)}   Balance: ₹${invoice.balanceDue.toFixed(2)}`, {
    x: 280,
    y,
    size: 10,
    font,
  });

  y -= 30;
  page.drawText(`Amount in words: ${invoice.summary.amountInWords}`, {
    x: 40,
    y,
    size: 9,
    font,
  });

  const bytes = await pdf.save();

  const bookingName = sanitizeFilePart(invoice.buyer.name || "Booking");
  const eventDate = sanitizeFilePart(formatDateLabel(invoice.bookedForDate || invoice.invoiceDate));
  const fileName = `Mangalam - ${bookingName}-${eventDate}.pdf`;

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "no-store",
    },
  });
}
