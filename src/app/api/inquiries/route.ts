import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStore } from "@/lib/data";
import type { InquiryIndexEntry } from "@/types/inquiry";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = getStore();
  const index = await store.list<InquiryIndexEntry>("inquiries");

  // Map index fields to what the dashboard expects
  const inquiries = index.map((entry) => ({
    id: entry.id,
    name: entry.name,
    phone: entry.phone,
    email: "",
    eventType: entry.eventType,
    eventDate: entry.preferredDate,
    status: entry.status,
    source: "website",
    createdAt: entry.submittedAt,
    message: "",
  }));

  return NextResponse.json({ inquiries });
}
