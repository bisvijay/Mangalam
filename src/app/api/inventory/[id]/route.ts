import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { getAuditActor, writeAuditLog } from "@/lib/audit";
import type { InventoryItem, InventoryIndexEntry } from "@/types/inventory";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = getStore();
  const item = await store.get<InventoryItem>("inventory", params.id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(item);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = getStore();
  const existing = await store.get<InventoryItem>("inventory", params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json() as Partial<InventoryItem>;
  const updated: InventoryItem = {
    ...existing,
    ...body,
    id: params.id,
    lastUpdated: new Date().toISOString(),
  };

  const indexEntry: InventoryIndexEntry = {
    id: params.id,
    name: updated.name,
    category: updated.category,
    quantity: updated.quantity,
    minStock: updated.minStock,
    isLowStock: updated.quantity < updated.minStock,
  };

  await store.put("inventory", params.id, updated, indexEntry);

  const actor = getAuditActor(session.user as { id?: string; username?: string; name?: string });
  await writeAuditLog({
    action: "update",
    entity: "inventory",
    entityId: params.id,
    actorId: actor.actorId,
    actorName: actor.actorName,
    source: "dashboard",
    summary: `Updated inventory item ${updated.name}`,
    details: {
      quantity: updated.quantity,
      minStock: updated.minStock,
      category: updated.category,
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
  const existing = await store.get<InventoryItem>("inventory", params.id);
  await store.delete("inventory", params.id);

  const actor = getAuditActor(session.user as { id?: string; username?: string; name?: string });
  await writeAuditLog({
    action: "delete",
    entity: "inventory",
    entityId: params.id,
    actorId: actor.actorId,
    actorName: actor.actorName,
    source: "dashboard",
    summary: `Deleted inventory item ${existing?.name || params.id}`,
    details: {
      name: existing?.name || "",
      category: existing?.category || "",
    },
  });

  return NextResponse.json({ success: true });
}
