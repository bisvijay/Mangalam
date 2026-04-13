import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStore } from "@/lib/data";
import type { WebsiteContent } from "@/types/website";

export async function GET() {
  const store = getStore();
  const content = await store.getConfig<WebsiteContent>("website/content.json");
  const settings = await store.getConfig<Record<string, unknown>>("settings/config.json");

  const merged = {
    ...(content ?? {}),
    contactInfo: {
      phone: content?.contactInfo?.phone || String(settings?.phone ?? ""),
      email: content?.contactInfo?.email || String(settings?.email ?? ""),
      address: content?.contactInfo?.address || String(settings?.address ?? ""),
      googleMapsEmbed: content?.contactInfo?.googleMapsEmbed || "",
    },
  };

  return NextResponse.json(merged);
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as Partial<WebsiteContent>;
  const store = getStore();
  const existing = await store.getConfig<WebsiteContent>("website/content.json");

  const updated: WebsiteContent = {
    hero: {
      title: body.hero?.title ?? existing?.hero?.title ?? "Mangalam Banquet Hall & Hotel",
      subtitle: body.hero?.subtitle ?? existing?.hero?.subtitle ?? "",
      backgroundImage: body.hero?.backgroundImage ?? existing?.hero?.backgroundImage ?? "",
    },
    about: body.about ?? existing?.about ?? "",
    amenities: body.amenities ?? existing?.amenities ?? [],
    eventTypes: body.eventTypes ?? existing?.eventTypes ?? [],
    testimonials: body.testimonials ?? existing?.testimonials ?? [],
    contactInfo: {
      phone: body.contactInfo?.phone ?? existing?.contactInfo?.phone ?? "",
      email: body.contactInfo?.email ?? existing?.contactInfo?.email ?? "",
      address: body.contactInfo?.address ?? existing?.contactInfo?.address ?? "",
      googleMapsEmbed: body.contactInfo?.googleMapsEmbed ?? existing?.contactInfo?.googleMapsEmbed ?? "",
    },
    footerText: body.footerText ?? existing?.footerText ?? "",
  };

  await store.putConfig("website/content.json", updated);
  return NextResponse.json({ success: true, content: updated });
}
