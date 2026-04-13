import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { generateId } from "@/lib/utils";
import { getAuditActor, writeAuditLog } from "@/lib/audit";
import type { Booking, BookingIndexEntry } from "@/types/booking";
import type { Customer, CustomerIndexEntry } from "@/types/customer";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = getStore();
  const bookings = await store.list<BookingIndexEntry>("bookings");
  return NextResponse.json(bookings);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as Booking;
  const store = getStore();

  // Generate booking ID
  const existingIndex = await store.list<BookingIndexEntry>("bookings");
  const existingIds = existingIndex.map((e) => e.id);
  const id = generateId("B", existingIds);

  const now = new Date().toISOString();
  const booking: Booking = {
    ...body,
    id,
    createdAt: now,
    updatedAt: now,
    createdBy: (session.user as { username?: string })?.username ?? "admin",
  };

  const indexEntry: BookingIndexEntry = {
    id,
    eventDate: booking.eventDate,
    eventType: booking.eventType,
    status: booking.status,
    customerName: booking.customer.name,
    customerPhone: booking.customer.phone,
    hallId: booking.venue.hallId,
    grandTotal: booking.charges.grandTotal,
    totalPaid: booking.advance ?? 0,
    balanceDue: booking.balance ?? booking.charges.grandTotal,
    paymentStatus: booking.paymentStatus,
  };

  await store.put("bookings", id, booking, indexEntry);

  // Auto-create or update customer record
  await upsertCustomer(store, booking);

  const actor = getAuditActor(session.user as { id?: string; username?: string; name?: string });
  await writeAuditLog({
    action: "create",
    entity: "booking",
    entityId: id,
    actorId: actor.actorId,
    actorName: actor.actorName,
    source: "dashboard",
    summary: `Created booking ${id} for ${booking.customer.name}`,
    details: {
      status: booking.status,
      eventDate: booking.eventDate,
      grandTotal: booking.charges.grandTotal,
    },
  });

  return NextResponse.json({ success: true, id }, { status: 201 });
}

async function upsertCustomer(
  store: ReturnType<typeof getStore>,
  booking: Booking
) {
  const customerIndex = await store.list<CustomerIndexEntry>("customers");
  const existing = customerIndex.find(
    (c) => c.phone === booking.customer.phone
  );

  if (existing) {
    const customer = await store.get<Customer>("customers", existing.id);
    if (customer) {
      if (!customer.bookingIds.includes(booking.id)) {
        customer.bookingIds.push(booking.id);
      }
      if (!customer.eventTypes.includes(booking.eventType)) {
        customer.eventTypes.push(booking.eventType);
      }
      customer.totalSpent += booking.charges.grandTotal;
      customer.updatedAt = new Date().toISOString();

      const updatedIndex: CustomerIndexEntry = {
        ...existing,
        totalSpent: customer.totalSpent,
        bookingCount: customer.bookingIds.length,
      };
      await store.put("customers", existing.id, customer, updatedIndex);
    }
  } else {
    const custIds = customerIndex.map((c) => c.id);
    const custId = generateId("C", custIds);
    const now = new Date().toISOString();

    const customer: Customer = {
      id: custId,
      name: booking.customer.name,
      phone: booking.customer.phone,
      email: booking.customer.email,
      address: booking.customer.address,
      birthday: "",
      profession: "",
      bookingIds: [booking.id],
      inquiryIds: [],
      eventTypes: [booking.eventType],
      anniversaryDate: "",
      tags: [],
      totalSpent: booking.charges.grandTotal,
      notes: "",
      createdAt: now,
      updatedAt: now,
    };

    const custIndex: CustomerIndexEntry = {
      id: custId,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      profession: customer.profession,
      tags: [],
      totalSpent: customer.totalSpent,
      bookingCount: 1,
    };
    await store.put("customers", custId, customer, custIndex);
  }
}
