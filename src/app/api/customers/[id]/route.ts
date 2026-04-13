import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { getAuditActor, writeAuditLog } from "@/lib/audit";
import type { Customer, CustomerIndexEntry } from "@/types/customer";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = getStore();
  const customer = await store.get<Customer>("customers", params.id);
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json(customer);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = getStore();
  const existing = await store.get<Customer>("customers", params.id);
  if (!existing) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const body = await request.json() as Partial<Customer>;

  const name = (body.name ?? existing.name).trim();
  const phone = (body.phone ?? existing.phone).trim();
  const email = (body.email ?? existing.email).trim();
  const address = (body.address ?? existing.address).trim();
  const profession = (body.profession ?? existing.profession ?? "").trim();
  const birthday = body.birthday ?? existing.birthday ?? "";

  if (!name || !phone) {
    return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
  }

  const updated: Customer = {
    ...existing,
    name,
    phone,
    email,
    address,
    birthday,
    profession,
    anniversaryDate: body.anniversaryDate ?? existing.anniversaryDate,
    tags: body.tags ?? existing.tags,
    notes: body.notes ?? existing.notes,
    updatedAt: new Date().toISOString(),
  };

  const indexEntry: CustomerIndexEntry = {
    id: updated.id,
    name: updated.name,
    phone: updated.phone,
    email: updated.email,
    profession: updated.profession,
    tags: updated.tags,
    totalSpent: updated.totalSpent,
    bookingCount: updated.bookingIds.length,
  };

  await store.put("customers", params.id, updated, indexEntry);

  const actor = getAuditActor(session.user as { id?: string; username?: string; name?: string });
  await writeAuditLog({
    action: "update",
    entity: "customer",
    entityId: params.id,
    actorId: actor.actorId,
    actorName: actor.actorName,
    source: "dashboard",
    summary: `Updated customer ${updated.name}`,
    details: {
      phone: updated.phone,
      profession: updated.profession,
    },
  });

  return NextResponse.json({ success: true, customer: updated });
}
