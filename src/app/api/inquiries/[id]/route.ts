import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { getAuditActor, writeAuditLog } from "@/lib/audit";
import type { Inquiry, InquiryIndexEntry } from "@/types/inquiry";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = getStore();
  const inquiry = await store.get<Inquiry>("inquiries", params.id);
  if (!inquiry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(inquiry);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = getStore();
  const existing = await store.get<Inquiry>("inquiries", params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json() as Partial<Inquiry>;
  const updated: Inquiry = {
    ...existing,
    ...body,
    id: params.id,
    updatedAt: new Date().toISOString(),
  };

  const indexEntry: InquiryIndexEntry = {
    id: params.id,
    name: updated.name,
    phone: updated.phone,
    eventType: updated.eventType,
    preferredDate: updated.preferredDate,
    status: updated.status,
    submittedAt: updated.submittedAt,
    quotedAmount: updated.quotedAmount,
  };

  await store.put("inquiries", params.id, updated, indexEntry);

  const actor = getAuditActor(session.user as { id?: string; username?: string; name?: string });
  await writeAuditLog({
    action: updated.status !== existing.status ? "status-change" : "update",
    entity: "inquiry",
    entityId: params.id,
    actorId: actor.actorId,
    actorName: actor.actorName,
    source: "dashboard",
    summary:
      updated.status !== existing.status
        ? `Inquiry ${params.id} status changed from ${existing.status} to ${updated.status}`
        : `Updated inquiry ${params.id}`,
    details: {
      name: updated.name,
      phone: updated.phone,
      quotedAmount: updated.quotedAmount,
    },
  });

  return NextResponse.json({ success: true });
}
