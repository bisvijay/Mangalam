import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { getAuditActor, writeAuditLog } from "@/lib/audit";
import type { Booking, BookingIndexEntry } from "@/types/booking";
import type { Invoice, InvoiceIndexEntry } from "@/types/invoice";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = getStore();
  const booking = await store.get<Booking>("bookings", params.id);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(booking);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = getStore();
  const existing = await store.get<Booking>("bookings", params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json() as Partial<Booking> & { invoiceDate?: string };
  const nextStatus = body.status ?? existing.status;
  const nextCancellationNote = (body.cancellationNote ?? existing.cancellationNote ?? "").trim();

  if (nextStatus === "cancelled" && !nextCancellationNote) {
    return NextResponse.json({ error: "Cancellation note is required for cancelled bookings" }, { status: 400 });
  }

  // Extract invoiceDate before spreading body into booking
  const newInvoiceDate = body.invoiceDate;
  delete body.invoiceDate;

  const updated: Booking = {
    ...existing,
    ...body,
    cancellationNote: nextStatus === "cancelled" ? nextCancellationNote : "",
    id: params.id,
    updatedAt: new Date().toISOString(),
  };

  const indexEntry: BookingIndexEntry = {
    id: params.id,
    eventDate: updated.eventDate,
    eventType: updated.eventType,
    status: updated.status,
    customerName: updated.customer.name,
    customerPhone: updated.customer.phone,
    hallId: updated.venue.hallId,
    grandTotal: updated.charges.grandTotal,
    totalPaid: updated.advance ?? 0,
    balanceDue: updated.balance ?? updated.charges.grandTotal,
    paymentStatus: updated.paymentStatus,
  };

  await store.put("bookings", params.id, updated, indexEntry);

  // Sync invoice date if changed
  if (newInvoiceDate && updated.invoiceId) {
    const invoiceFileId = updated.invoiceId.replace(/\//g, "-");
    const invoice = await store.get<Invoice>("invoices", invoiceFileId);
    if (invoice) {
      invoice.invoiceDate = newInvoiceDate;
      const invIndex: InvoiceIndexEntry = {
        id: invoice.id,
        bookingId: params.id,
        bookedForDate: invoice.bookedForDate,
        invoiceDate: newInvoiceDate,
        invoiceType: invoice.invoiceType,
        customerName: invoice.buyer.name,
        grandTotal: invoice.summary.grandTotalRounded,
        totalPaid: invoice.totalPaid,
        balanceDue: invoice.balanceDue,
        paymentStatus: invoice.paymentStatus,
      };
      await store.put("invoices", invoiceFileId, invoice, invIndex);
    }
  }

  const actor = getAuditActor(session.user as { id?: string; username?: string; name?: string });
  await writeAuditLog({
    action: updated.status !== existing.status ? "status-change" : "update",
    entity: "booking",
    entityId: params.id,
    actorId: actor.actorId,
    actorName: actor.actorName,
    source: "dashboard",
    summary:
      updated.status !== existing.status
        ? `Booking ${params.id} status changed from ${existing.status} to ${updated.status}`
        : `Updated booking ${params.id}`,
    details: {
      previousStatus: existing.status,
      newStatus: updated.status,
      cancellationNote: updated.cancellationNote || "",
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = getStore();
  const existing = await store.get<Booking>("bookings", params.id);
  await store.delete("bookings", params.id);

  const actor = getAuditActor(session.user as { id?: string; username?: string; name?: string });
  await writeAuditLog({
    action: "delete",
    entity: "booking",
    entityId: params.id,
    actorId: actor.actorId,
    actorName: actor.actorName,
    source: "dashboard",
    summary: `Deleted booking ${params.id}`,
    details: {
      customerName: existing?.customer?.name || "",
      eventDate: existing?.eventDate || "",
    },
  });

  return NextResponse.json({ success: true });
}
