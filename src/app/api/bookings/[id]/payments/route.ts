import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { getAuditActor, writeAuditLog } from "@/lib/audit";
import { toISODateString } from "@/lib/utils";
import type { Booking, BookingIndexEntry, Payment, PaymentMethod } from "@/types/booking";
import type { Invoice, InvoiceIndexEntry } from "@/types/invoice";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = getStore();
  const booking = await store.get<Booking>("bookings", params.id);
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const body = await request.json();
  const { amount, method, receipt, notes } = body;

  if (!amount || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
  }

  const validMethods: PaymentMethod[] = ["cash", "upi", "bank", "card", "other"];
  if (!validMethods.includes(method)) {
    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
  }

  // Add the new payment
  const payment: Payment = {
    date: toISODateString(),
    amount,
    method,
    receipt: receipt || "",
    notes: notes || "",
  };

  booking.payments = [...(booking.payments || []), payment];
  booking.advance = booking.payments.reduce((sum, p) => sum + p.amount, 0);
  booking.balance = Math.round((booking.charges.grandTotal - booking.advance) * 100) / 100;
  booking.paymentStatus =
    booking.advance >= booking.charges.grandTotal ? "paid" :
    booking.advance > 0 ? "partial" : "unpaid";
  booking.updatedAt = new Date().toISOString();

  // Update booking
  const bookingIndex: BookingIndexEntry = {
    id: params.id,
    eventDate: booking.eventDate,
    eventType: booking.eventType,
    status: booking.status,
    customerName: booking.customer.name,
    customerPhone: booking.customer.phone,
    hallId: booking.venue.hallId,
    grandTotal: booking.charges.grandTotal,
    totalPaid: booking.advance,
    balanceDue: booking.balance,
    paymentStatus: booking.paymentStatus,
  };

  await store.put("bookings", params.id, booking, bookingIndex);

  // Sync invoice if one exists
  if (booking.invoiceId) {
    const invoiceFileId = booking.invoiceId.replace(/\//g, "-");
    const invoice = await store.get<Invoice>("invoices", invoiceFileId);
    if (invoice) {
      invoice.payments = booking.payments.map((p) => ({
        date: p.date,
        amount: p.amount,
        method: p.method,
        reference: p.receipt || "",
      }));
      invoice.totalPaid = booking.advance;
      invoice.balanceDue = Math.round((invoice.summary.grandTotalRounded - booking.advance) * 100) / 100;
      invoice.paymentStatus =
        booking.advance >= invoice.summary.grandTotalRounded ? "paid" :
        booking.advance > 0 ? "partial" : "unpaid";

      const invoiceIndex: InvoiceIndexEntry = {
        id: invoice.id,
        bookingId: params.id,
        bookedForDate: invoice.bookedForDate,
        invoiceDate: invoice.invoiceDate,
        invoiceType: invoice.invoiceType,
        customerName: invoice.buyer.name,
        grandTotal: invoice.summary.grandTotalRounded,
        totalPaid: invoice.totalPaid,
        balanceDue: invoice.balanceDue,
        paymentStatus: invoice.paymentStatus,
      };

      await store.put("invoices", invoiceFileId, invoice, invoiceIndex);
    }
  }

  // Audit log
  const actor = getAuditActor(session.user as { id?: string; username?: string; name?: string });
  await writeAuditLog({
    action: "payment",
    entity: "booking",
    entityId: params.id,
    actorId: actor.actorId,
    actorName: actor.actorName,
    source: "dashboard",
    summary: `Payment of ₹${amount} recorded for booking ${params.id} via ${method}`,
    details: { amount, method, receipt, totalPaid: booking.advance, balance: booking.balance },
  });

  return NextResponse.json({
    success: true,
    totalPaid: booking.advance,
    balance: booking.balance,
    paymentStatus: booking.paymentStatus,
  });
}
