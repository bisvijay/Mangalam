import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { getAuditActor, writeAuditLog } from "@/lib/audit";
import type { Invoice, InvoiceIndexEntry, InvoiceLineItem, GSTSummaryRow } from "@/types/invoice";
import type { Booking, BookingIndexEntry } from "@/types/booking";

const SAC_ROOM = "996311";
const SAC_HALL = "996332";
const SAC_CATERING = "996333";
const SAC_DECORATION = "998596";
const SAC_OTHER = "999799";

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

async function deactivateOtherInvoicesForBooking(
  store: ReturnType<typeof getStore>,
  activeInvoice: Invoice
) {
  const all = await store.list<InvoiceIndexEntry>("invoices");
  const others = all.filter(
    (inv) => inv.bookingId === activeInvoice.bookingId && inv.id !== activeInvoice.id && inv.isActive !== false
  );

  for (const other of others) {
    const otherFileId = other.id.replace(/\//g, "-");
    const otherInvoice = await store.get<Invoice>("invoices", otherFileId);
    if (!otherInvoice) continue;

    otherInvoice.isActive = false;
    const otherIndex: InvoiceIndexEntry = {
      id: otherInvoice.id,
      bookingId: otherInvoice.bookingId,
      bookedForDate: otherInvoice.bookedForDate,
      invoiceDate: otherInvoice.invoiceDate,
      invoiceType: otherInvoice.invoiceType,
      customerName: otherInvoice.buyer.name,
      grandTotal: otherInvoice.summary.grandTotalRounded,
      totalPaid: otherInvoice.totalPaid,
      balanceDue: otherInvoice.balanceDue,
      paymentStatus: otherInvoice.paymentStatus,
      isActive: false,
    };
    await store.put("invoices", otherFileId, otherInvoice, otherIndex);
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = getStore();
  // Invoice IDs are stored with hyphens replacing slashes (INV-2526-0001)
  const invoice = await store.get<Invoice>("invoices", params.id);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  return NextResponse.json(invoice);
}

// PATCH: record a new payment against an invoice
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = getStore();
  const invoice = await store.get<Invoice>("invoices", params.id);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const body = await request.json();
  let auditAction: "sync" | "payment" = "payment";
  let auditSummary = `Recorded payment on invoice ${invoice.id}`;
  let auditDetails: Record<string, unknown> = {};

  // Sync invoice totals/line-items from current booking values after booking edits
  if (body?.action === "syncFromBooking") {
    const booking = await store.get<Booking>("bookings", invoice.bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Linked booking not found" }, { status: 404 });
    }

    const lineItems = buildLineItems(booking);
    const subtotal = lineItems.reduce((s, li) => s + li.amount, 0);
    const totalCGST = Math.round(lineItems.reduce((s, li) => s + li.cgst, 0) * 100) / 100;
    const totalSGST = Math.round(lineItems.reduce((s, li) => s + li.sgst, 0) * 100) / 100;
    const totalGST = Math.round((totalCGST + totalSGST) * 100) / 100;
    const grandTotal = Math.round((subtotal + totalGST) * 100) / 100;
    const grandTotalRounded = Math.round(grandTotal);
    const roundOff = Math.round((grandTotalRounded - grandTotal) * 100) / 100;
    const totalPaid = Math.round(invoice.payments.reduce((s, p) => s + p.amount, 0) * 100) / 100;
    const balanceDue = Math.round((grandTotalRounded - totalPaid) * 100) / 100;

    invoice.buyer = {
      ...invoice.buyer,
      name: booking.customer.name,
      phone: booking.customer.phone,
      email: booking.customer.email || "",
      address: booking.customer.address || "",
    };
    invoice.invoiceDate = booking.bookingDate;
    invoice.bookedForDate = booking.eventDate;
    invoice.lineItems = lineItems;
    invoice.gstSummary = buildGSTSummary(lineItems);
    invoice.summary = {
      subtotal,
      totalCGST,
      totalSGST,
      totalIGST: 0,
      totalGST,
      grandTotal,
      roundOff,
      grandTotalRounded,
      amountInWords: numberToWords(grandTotalRounded),
    };
    invoice.totalPaid = totalPaid;
    invoice.balanceDue = balanceDue;
    invoice.paymentStatus =
      totalPaid >= grandTotalRounded
        ? "paid"
        : totalPaid > 0
        ? "partial"
        : "unpaid";
    invoice.isActive = true;

    await deactivateOtherInvoicesForBooking(store, invoice);
    auditAction = "sync";
    auditSummary = `Synced invoice ${invoice.id} from booking ${invoice.bookingId}`;
    auditDetails = {
      bookingId: invoice.bookingId,
      grandTotal: grandTotalRounded,
      totalPaid,
      balanceDue,
    };
  } else {
    const { date, amount, method, reference = "" } = body;

    if (!date || !amount || !method) {
      return NextResponse.json({ error: "date, amount and method are required" }, { status: 400 });
    }
    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
    }

    // Add payment to invoice
    invoice.payments.push({ date, amount: paymentAmount, method, reference });
    invoice.totalPaid = Math.round((invoice.totalPaid + paymentAmount) * 100) / 100;
    invoice.balanceDue = Math.round((invoice.summary.grandTotalRounded - invoice.totalPaid) * 100) / 100;
    invoice.paymentStatus =
      invoice.totalPaid >= invoice.summary.grandTotalRounded
        ? "paid"
        : invoice.totalPaid > 0
        ? "partial"
        : "unpaid";
    invoice.isActive = invoice.isActive ?? true;
    auditAction = "payment";
    auditSummary = `Added payment on invoice ${invoice.id}`;
    auditDetails = {
      paymentDate: date,
      paymentAmount,
      method,
      balanceDue: invoice.balanceDue,
    };

    // Sync payment to the linked booking
    const booking = await store.get<Booking>("bookings", invoice.bookingId);
    if (booking) {
      booking.payments.push({ date, amount: paymentAmount, method: method as Booking["payments"][0]["method"], receipt: reference });
      booking.advance = Math.round((booking.advance + paymentAmount) * 100) / 100;
      booking.balance = Math.round((booking.charges.grandTotal - booking.advance) * 100) / 100;
      booking.paymentStatus =
        booking.advance >= booking.charges.grandTotal
          ? "paid"
          : booking.advance > 0
          ? "partial"
          : "unpaid";
      booking.updatedAt = new Date().toISOString();

      const bookingIndex = await store.list<BookingIndexEntry>("bookings");
      const existingEntry = bookingIndex.find((b) => b.id === invoice.bookingId);
      if (existingEntry) {
        existingEntry.paymentStatus = booking.paymentStatus;
        existingEntry.totalPaid = booking.advance;
        existingEntry.balanceDue = booking.balance;
        await store.put("bookings", invoice.bookingId, booking, existingEntry);
      }
    }
  }

  // Save updated invoice
  const indexEntry: InvoiceIndexEntry = {
    id: invoice.id,
    bookingId: invoice.bookingId,
    bookedForDate: invoice.bookedForDate,
    invoiceDate: invoice.invoiceDate,
    invoiceType: invoice.invoiceType,
    customerName: invoice.buyer.name,
    grandTotal: invoice.summary.grandTotalRounded,
    totalPaid: invoice.totalPaid,
    balanceDue: invoice.balanceDue,
    paymentStatus: invoice.paymentStatus,
    isActive: invoice.isActive ?? true,
  };
  await store.put("invoices", params.id, invoice, indexEntry);

  const actor = getAuditActor(session.user as { id?: string; username?: string; name?: string });
  await writeAuditLog({
    action: auditAction,
    entity: "invoice",
    entityId: invoice.id,
    actorId: actor.actorId,
    actorName: actor.actorName,
    source: "dashboard",
    summary: auditSummary,
    details: auditDetails,
  });

  return NextResponse.json(invoice);
}
