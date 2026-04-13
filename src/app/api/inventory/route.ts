import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { generateId } from "@/lib/utils";
import { getAuditActor, writeAuditLog } from "@/lib/audit";
import type { InventoryItem, InventoryIndexEntry } from "@/types/inventory";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = getStore();
  const items = await store.list<InventoryIndexEntry>("inventory");
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as Partial<InventoryItem>;
  const store = getStore();

  const existingIndex = await store.list<InventoryIndexEntry>("inventory");
  const id = generateId("ITM", existingIndex.map((i) => i.id));
  const now = new Date().toISOString();

  const item: InventoryItem = {
    id,
    name: body.name ?? "",
    category: body.category ?? "Other",
    quantity: body.quantity ?? 0,
    unit: body.unit ?? "pcs",
    minStock: body.minStock ?? 0,
    location: body.location ?? "",
    lastUpdated: now,
    notes: body.notes ?? "",
  };

  const indexEntry: InventoryIndexEntry = {
    id,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    minStock: item.minStock,
    isLowStock: item.quantity < item.minStock,
  };

  await store.put("inventory", id, item, indexEntry);

  const actor = getAuditActor(session.user as { id?: string; username?: string; name?: string });
  await writeAuditLog({
    action: "create",
    entity: "inventory",
    entityId: id,
    actorId: actor.actorId,
    actorName: actor.actorName,
    source: "dashboard",
    summary: `Created inventory item ${item.name}`,
    details: {
      category: item.category,
      quantity: item.quantity,
      minStock: item.minStock,
    },
  });

  return NextResponse.json({ success: true, id }, { status: 201 });
}
