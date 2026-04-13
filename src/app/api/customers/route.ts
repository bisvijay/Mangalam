import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { generateId } from "@/lib/utils";
import { getAuditActor, writeAuditLog } from "@/lib/audit";
import type { Customer, CustomerIndexEntry } from "@/types/customer";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = getStore();
  const customers = await store.list<CustomerIndexEntry>("customers");
  return NextResponse.json(customers);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as Partial<Customer>;
  const store = getStore();

  const existingIndex = await store.list<CustomerIndexEntry>("customers");
  const id = generateId("C", existingIndex.map((c) => c.id));
  const now = new Date().toISOString();

  const customer: Customer = {
    id,
    name: body.name ?? "",
    phone: body.phone ?? "",
    email: body.email ?? "",
    address: body.address ?? "",
    birthday: body.birthday ?? "",
    profession: body.profession ?? "",
    bookingIds: [],
    inquiryIds: [],
    eventTypes: [],
    anniversaryDate: body.anniversaryDate ?? "",
    tags: body.tags ?? [],
    totalSpent: 0,
    notes: body.notes ?? "",
    createdAt: now,
    updatedAt: now,
  };

  const indexEntry: CustomerIndexEntry = {
    id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    profession: customer.profession,
    tags: customer.tags,
    totalSpent: 0,
    bookingCount: 0,
  };

  await store.put("customers", id, customer, indexEntry);

  const actor = getAuditActor(session.user as { id?: string; username?: string; name?: string });
  await writeAuditLog({
    action: "create",
    entity: "customer",
    entityId: id,
    actorId: actor.actorId,
    actorName: actor.actorName,
    source: "dashboard",
    summary: `Created customer ${customer.name}`,
    details: {
      phone: customer.phone,
      profession: customer.profession,
    },
  });

  return NextResponse.json({ success: true, id }, { status: 201 });
}
