import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { generateId } from "@/lib/utils";
import { writeAuditLog, getAuditActor } from "@/lib/audit";
import type { PublicEvent, PublicEventIndexEntry } from "@/types/event";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = getStore();
  const index = await store.list<PublicEventIndexEntry>("events");
  return NextResponse.json({ events: index });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, date, details } = body as { name?: string; date?: string; details?: string };

  if (!name?.trim() || !date?.trim()) {
    return NextResponse.json({ error: "Name and date are required" }, { status: 400 });
  }

  const store = getStore();
  const existingIndex = await store.list<PublicEventIndexEntry>("events");
  const existingIds = existingIndex.map((e) => e.id);
  const id = generateId("EVT", existingIds);
  const now = new Date().toISOString();

  const event: PublicEvent = {
    id,
    name: name.trim(),
    date,
    details: (details || "").trim(),
    visible: true,
    createdAt: now,
    updatedAt: now,
  };

  const indexEntry: PublicEventIndexEntry = {
    id,
    name: event.name,
    date: event.date,
    visible: true,
  };

  await store.put("events", id, event, indexEntry);

  const actor = getAuditActor(session.user as { id?: string; username?: string; name?: string });
  await writeAuditLog({
    action: "create",
    entity: "event",
    entityId: id,
    actorId: actor.actorId,
    actorName: actor.actorName,
    source: "dashboard",
    summary: `Created public event "${event.name}" on ${event.date}`,
    details: { name: event.name, date: event.date },
  });

  return NextResponse.json({ success: true, id });
}
