import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStore } from "@/lib/data";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = getStore();
  const settings = await store.getConfig<Record<string, unknown>>("settings/config.json");
  return NextResponse.json(settings ?? {});
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as Record<string, unknown>;
  const store = getStore();
  const existing = await store.getConfig<Record<string, unknown>>("settings/config.json") ?? {};

  const merged = {
    ...existing,
    ...body,
    businessName: String(body.businessName ?? existing.businessName ?? ""),
    gstin: String(body.gstin ?? existing.gstin ?? ""),
    phone: String(body.phone ?? existing.phone ?? ""),
    email: String(body.email ?? existing.email ?? ""),
    address: String(body.address ?? existing.address ?? ""),
    stateCode: String(body.stateCode ?? existing.stateCode ?? "10"),
    state: String(body.state ?? existing.state ?? ""),
  };

  await store.putConfig("settings/config.json", merged);
  return NextResponse.json({ success: true, settings: merged });
}