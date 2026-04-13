import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { getFinancialYear } from "@/lib/utils";
import { getAuditActor, writeAuditLog } from "@/lib/audit";
import type { Invoice, InvoiceIndexEntry, InvoiceLineItem, GSTSummaryRow } from "@/types/invoice";
import type { Booking } from "@/types/booking";

// SAC codes for hotel/banquet services
const SAC_ROOM = "996311"; // Hotel accommodation
const SAC_HALL = "996332"; // Convention/banquet
const SAC_CATERING = "996333"; // Catering
const SAC_DECORATION = "998596"; // Event decoration
const SAC_OTHER = "999799"; // Other services

function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
  }

  const rounded = Math.round(num);
  return "Rupees " + convert(rounded) + " Only";
}

function buildLineItems(booking: Booking): InvoiceLineItem[] {
  const items: InvoiceLineItem[] = [];
  let sno = 0;

  if (booking.charges.roomTotal > 0) {
    sno++;
    const gstEntry = booking.charges.gstBreakdown?.find((g) => g.item?.includes("Room") || g.item?.includes("room") || g.item?.includes("Exempt") || g.item?.includes("GST (₹"));
    const gstRate = gstEntry?.rate ?? 0;
    const base = booking.charges.roomTotal;
    const cgst = Math.round(base * (gstRate / 2 / 100) * 100) / 100;
    const sgst = Math.round(base * (gstRate / 2 / 100) * 100) / 100;
    items.push({
      sno,
      description: `Room Accommodation (${booking.venue.roomsBooked} rooms × ${booking.charges.roomNights} nights @ ₹${booking.charges.roomRate}/night)`,
      sacCode: SAC_ROOM,
      qty: booking.venue.roomsBooked * booking.charges.roomNights,
      rate: booking.charges.roomRate,
      amount: base,
      gstRate,
      cgst,
      sgst,
      igst: 0,
      total: Math.round((base + cgst + sgst) * 100) / 100,
    });
  }

  if (booking.charges.hallCharge > 0) {
    sno++;
    const base = booking.charges.hallCharge;
    const gstRate = 18;
    const cgst = Math.round(base * 0.09 * 100) / 100;
    const sgst = Math.round(base * 0.09 * 100) / 100;
    items.push({
      sno,
      description: `Banquet Hall (${booking.venue.hallId})`,
      sacCode: SAC_HALL,
      qty: 1,
      rate: base,
      amount: base,
      gstRate,
      cgst,
      sgst,
      igst: 0,
      total: Math.round((base + cgst + sgst) * 100) / 100,
    });
  }

  if (booking.charges.cateringCharge > 0) {
    sno++;
    const base = booking.charges.cateringCharge;
    const gstRate = 5;
    const cgst = Math.round(base * 0.025 * 100) / 100;
    const sgst = Math.round(base * 0.025 * 100) / 100;
    items.push({
      sno,
      description: `Food & Catering (${booking.venue.guestsCount} guests)`,
      sacCode: SAC_CATERING,
      qty: 1,
      rate: base,
      amount: base,
      gstRate,
      cgst,
      sgst,
      igst: 0,
      total: Math.round((base + cgst + sgst) * 100) / 100,
    });
  }

  if (booking.charges.decorationCharge > 0) {
    sno++;
    const base = booking.charges.decorationCharge;
    const gstRate = 18;
    const cgst = Math.round(base * 0.09 * 100) / 100;
    const sgst = Math.round(base * 0.09 * 100) / 100;
    items.push({
      sno,
      description: "Decoration & Event Setup",
      sacCode: SAC_DECORATION,
      qty: 1,
      rate: base,
      amount: base,
      gstRate,
      cgst,
      sgst,
      igst: 0,
      total: Math.round((base + cgst + sgst) * 100) / 100,
    });
  }

  if (booking.charges.otherCharges > 0) {
    sno++;
    const base = booking.charges.otherCharges;
    const gstRate = 18;
    const cgst = Math.round(base * 0.09 * 100) / 100;
    const sgst = Math.round(base * 0.09 * 100) / 100;
    items.push({
      sno,
      description: "Other Services & Charges",
      sacCode: SAC_OTHER,
      qty: 1,
      rate: base,
      amount: base,
      gstRate,
      cgst,
      sgst,
      igst: 0,
      total: Math.round((base + cgst + sgst) * 100) / 100,
    });
  }

  return items;
}

function buildGSTSummary(lineItems: InvoiceLineItem[]): GSTSummaryRow[] {
  const rateMap = new Map<number, GSTSummaryRow>();
  for (const item of lineItems) {
    if (item.gstRate === 0) continue;
    const existing = rateMap.get(item.gstRate);
    if (existing) {
      existing.taxableValue += item.amount;
      existing.cgst += item.cgst;
      existing.sgst += item.sgst;
      existing.total += item.cgst + item.sgst;
    } else {
      rateMap.set(item.gstRate, {
        rate: item.gstRate,
        taxableValue: item.amount,
        cgst: item.cgst,
        sgst: item.sgst,
        igst: 0,
        total: item.cgst + item.sgst,
      });
    }
  }
  return Array.from(rateMap.values());
}

// GET: list all invoices
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = getStore();
  const invoices = await store.list<InvoiceIndexEntry>("invoices");
  const dedupedById = new Map<string, InvoiceIndexEntry>();
  for (const inv of invoices) {
    dedupedById.set(inv.id, inv);
  }
  const activeInvoices = Array.from(dedupedById.values()).filter((inv) => inv.isActive !== false);
  return NextResponse.json({ invoices: activeInvoices });
}

// POST: generate invoice from a booking
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { bookingId, invoiceType = "tax_invoice" } = body;

  if (!bookingId) {
    return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
  }

  const store = getStore();

  // Load booking
  const booking = await store.get<Booking>("bookings", bookingId);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Load settings for seller info
  const settings = await store.getConfig<{
    businessName: string;
    gstin: string;
    address: string;
    phone: string;
    email: string;
    stateCode: string;
    state: string;
  }>("settings/config");

  // Generate invoice ID
  const existingInvoices = await store.list<InvoiceIndexEntry>("invoices");

  // Deactivate previous active invoices for this booking
  const previousForBooking = existingInvoices.filter((inv) => inv.bookingId === bookingId && inv.isActive !== false);
  for (const prev of previousForBooking) {
    const prevFileId = prev.id.replace(/\//g, "-");
    const prevInvoice = await store.get<Invoice>("invoices", prevFileId);
    if (!prevInvoice) continue;
    prevInvoice.isActive = false;
    const prevIndex: InvoiceIndexEntry = {
      id: prevInvoice.id,
      bookingId: prevInvoice.bookingId,
      bookedForDate: prevInvoice.bookedForDate,
      invoiceDate: prevInvoice.invoiceDate,
      invoiceType: prevInvoice.invoiceType,
      customerName: prevInvoice.buyer.name,
      grandTotal: prevInvoice.summary.grandTotalRounded,
      totalPaid: prevInvoice.totalPaid,
      balanceDue: prevInvoice.balanceDue,
      paymentStatus: prevInvoice.paymentStatus,
      isActive: false,
    };
    await store.put("invoices", prevFileId, prevInvoice, prevIndex);
  }

  const fy = getFinancialYear(new Date());
  const fyInvoices = existingInvoices.filter((inv) => inv.id.includes(fy));
  const seqNo = fyInvoices.length + 1;
  const invoiceId = `INV/${fy}/${String(seqNo).padStart(4, "0")}`;

  // Build line items from booking charges
  const lineItems = buildLineItems(booking);

  // Summary
  const subtotal = lineItems.reduce((s, li) => s + li.amount, 0);
  const totalCGST = Math.round(lineItems.reduce((s, li) => s + li.cgst, 0) * 100) / 100;
  const totalSGST = Math.round(lineItems.reduce((s, li) => s + li.sgst, 0) * 100) / 100;
  const totalGST = Math.round((totalCGST + totalSGST) * 100) / 100;
  const grandTotal = Math.round((subtotal + totalGST) * 100) / 100;
  const grandTotalRounded = Math.round(grandTotal);
  const roundOff = Math.round((grandTotalRounded - grandTotal) * 100) / 100;

  const gstSummary = buildGSTSummary(lineItems);

  // Payment info from booking
  const payments = (booking.payments || []).map((p) => ({
    date: p.date,
    amount: p.amount,
    method: p.method,
    reference: p.receipt || "",
  }));
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const balanceDue = Math.round((grandTotalRounded - totalPaid) * 100) / 100;

  const invoice: Invoice = {
    id: invoiceId,
    bookingId,
    bookedForDate: booking.eventDate,
    invoiceDate: booking.bookingDate,
    invoiceType,
    financialYear: fy,
    sequenceNo: seqNo,
    seller: {
      name: settings?.businessName || "Mangalam Banquet Hall & Hotel",
      gstin: settings?.gstin || "10ANSPD0701C1ZY",
      address: settings?.address || "Ward No 37, Bettiah, West Champaran, Bihar - 845438",
      phone: settings?.phone || "83839 81280",
      stateCode: settings?.stateCode || "10",
      state: settings?.state || "Bihar",
    },
    buyer: {
      name: booking.customer.name,
      phone: booking.customer.phone,
      email: booking.customer.email || "",
      address: booking.customer.address || "",
      gstin: "",
      stateCode: "10",
      state: "Bihar",
    },
    lineItems,
    summary: {
      subtotal,
      totalCGST,
      totalSGST,
      totalIGST: 0,
      totalGST,
      grandTotal,
      roundOff,
      grandTotalRounded,
      amountInWords: numberToWords(grandTotalRounded),
    },
    gstSummary,
    payments,
    totalPaid,
    balanceDue,
    paymentStatus: totalPaid >= grandTotalRounded ? "paid" : totalPaid > 0 ? "partial" : "unpaid",
    isActive: true,
    notes: "",
    termsAndConditions: "1. Payment is due within 7 days of invoice date.\n2. All disputes are subject to Bettiah, Bihar jurisdiction.",
    isSupplyIntraState: true,
    placeOfSupply: "Bihar (10)",
    createdAt: new Date().toISOString(),
    createdBy: session.user?.name || "admin",
  };

  // Save invoice
  const indexEntry: InvoiceIndexEntry = {
    id: invoiceId,
    bookingId,
    bookedForDate: booking.eventDate,
    invoiceDate: booking.bookingDate,
    invoiceType,
    customerName: booking.customer.name,
    grandTotal: grandTotalRounded,
    totalPaid,
    balanceDue,
    paymentStatus: invoice.paymentStatus,
    isActive: true,
  };

  await store.put("invoices", invoiceId.replace(/\//g, "-"), invoice, indexEntry);

  // Link invoice to booking
  booking.invoiceId = invoiceId;
  const bookingIndex = await store.list<{ id: string }>("bookings");
  const existingBookingEntry = bookingIndex.find((b) => b.id === bookingId);
  if (existingBookingEntry) {
    await store.put("bookings", bookingId, booking, existingBookingEntry);
  }

  const actor = getAuditActor(session.user as { id?: string; username?: string; name?: string });
  await writeAuditLog({
    action: "create",
    entity: "invoice",
    entityId: invoiceId,
    actorId: actor.actorId,
    actorName: actor.actorName,
    source: "dashboard",
    summary: `Created invoice ${invoiceId} for booking ${bookingId}`,
    details: {
      bookingId,
      customerName: booking.customer.name,
      grandTotal: grandTotalRounded,
      paymentStatus: invoice.paymentStatus,
    },
  });

  return NextResponse.json({ id: invoiceId, invoice }, { status: 201 });
}
