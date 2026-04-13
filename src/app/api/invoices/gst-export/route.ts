import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStore } from "@/lib/data";
import type { Invoice } from "@/types/invoice";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fy = searchParams.get("fy");
  const search = searchParams.get("search")?.toLowerCase() || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";

  const store = getStore();
  const indexEntries = await store.list<{ id: string; bookingId: string; customerName?: string }>("invoices");

  // Load invoice details with filters
  const invoices: Invoice[] = [];
  for (const entry of indexEntries) {
    const fileId = entry.id.replace(/\//g, "-");
    const inv = await store.get<Invoice>("invoices", fileId);
    if (inv) {
      if (fy && inv.financialYear !== fy) continue;
      if (dateFrom && inv.invoiceDate < dateFrom) continue;
      if (dateTo && inv.invoiceDate > dateTo) continue;
      if (search) {
        const matchesSearch =
          inv.id.toLowerCase().includes(search) ||
          inv.buyer.name.toLowerCase().includes(search) ||
          inv.bookingId.toLowerCase().includes(search);
        if (!matchesSearch) continue;
      }
      invoices.push(inv);
    }
  }

  // Build rows — one row per line item
  const rows: Record<string, string | number>[] = [];

  for (const inv of invoices) {
    const hasGstin = !!inv.buyer.gstin?.trim();
    const b2bOrB2c = hasGstin ? "B2B" : "B2C";
    const invDate = formatDDMMYYYY(inv.invoiceDate);

    for (const li of inv.lineItems) {
      rows.push({
        "B2B/B2C": b2bOrB2c,
        "Invoice No": inv.id,
        "Invoice Date": invDate,
        "Customer GSTIN": inv.buyer.gstin || "-",
        "Customer Name": inv.buyer.name,
        "Place of Supply (State Code)": inv.buyer.stateCode || "10",
        "HSN/SAC": li.sacCode,
        "Description": li.description,
        "Qty": li.qty,
        "Unit": "NA",
        "Taxable Value (₹)": li.amount,
        "GST Rate (%)": li.gstRate,
        "CGST (₹)": li.cgst,
        "SGST (₹)": li.sgst,
        "IGST (₹)": li.igst || 0,
        "Total (₹)": li.total,
      });
    }
  }

  // Sort by invoice date then invoice number
  rows.sort((a, b) => {
    const dateA = String(a["Invoice Date"]);
    const dateB = String(b["Invoice Date"]);
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    return String(a["Invoice No"]).localeCompare(String(b["Invoice No"]));
  });

  // Build Excel workbook
  const ws = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  ws["!cols"] = [
    { wch: 8 },   // B2B/B2C
    { wch: 18 },  // Invoice No
    { wch: 14 },  // Invoice Date
    { wch: 18 },  // Customer GSTIN
    { wch: 22 },  // Customer Name
    { wch: 12 },  // Place of Supply
    { wch: 10 },  // HSN/SAC
    { wch: 50 },  // Description
    { wch: 6 },   // Qty
    { wch: 6 },   // Unit
    { wch: 16 },  // Taxable Value
    { wch: 10 },  // GST Rate
    { wch: 12 },  // CGST
    { wch: 12 },  // SGST
    { wch: 12 },  // IGST
    { wch: 14 },  // Total
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "GST Returns");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const fyLabel = fy || "all";
  const filename = `Mangalam_GST_Returns_FY${fyLabel}.xlsx`;

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function formatDDMMYYYY(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}-${m}-${y}`;
}
