import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { writeAuditLog, getAuditActor } from "@/lib/audit";
import type { PublicEvent, PublicEventIndexEntry } from "@/types/event";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = getStore();
  const event = await store.get<PublicEvent>("events", params.id);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(event);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = getStore();
  const existing = await store.get<PublicEvent>("events", params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json() as Partial<PublicEvent>;
  const updated: PublicEvent = {
    ...existing,
    ...body,
    id: params.id,
    updatedAt: new Date().toISOString(),
  };

  const indexEntry: PublicEventIndexEntry = {
    id: params.id,
    name: updated.name,
    date: updated.date,
    visible: updated.visible,
  };

  await store.put("events", params.id, updated, indexEntry);

  const actor = getAuditActor(session.user as { id?: string; username?: string; name?: string });
  await writeAuditLog({
    action: "update",
    entity: "event",
    entityId: params.id,
    actorId: actor.actorId,
    actorName: actor.actorName,
    source: "dashboard",
    summary: `Updated event "${updated.name}"`,
    details: { name: updated.name, date: updated.date, visible: updated.visible },
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
  const existing = await store.get<PublicEvent>("events", params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await store.delete("events", params.id);

  const actor = getAuditActor(session.user as { id?: string; username?: string; name?: string });
  await writeAuditLog({
    action: "delete",
    entity: "event",
    entityId: params.id,
    actorId: actor.actorId,
    actorName: actor.actorName,
    source: "dashboard",
    summary: `Deleted event "${existing.name}"`,
    details: { name: existing.name },
  });

  return NextResponse.json({ success: true });
}
