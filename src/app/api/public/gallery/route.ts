import { NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import type { Gallery } from "@/types/media";

export async function GET() {
  const store = getStore();
  const gallery = await store.getConfig<Gallery>("media/gallery.json");
  const items = gallery?.items.filter((i) => i.visible) ?? [];
  items.sort((a, b) => a.order - b.order);
  return NextResponse.json(items);
}
