import { NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import type { PublicEventIndexEntry } from "@/types/event";
import type { PublicEvent } from "@/types/event";

export async function GET() {
  const store = getStore();
  const index = await store.list<PublicEventIndexEntry>("events");

  // Only return visible events, sorted by date ascending
  const visible = index.filter((e) => e.visible);
  visible.sort((a, b) => a.date.localeCompare(b.date));

  // Fetch full details for each visible event
  const events = await Promise.all(
    visible.map(async (entry) => {
      const full = await store.get<PublicEvent>("events", entry.id);
      return full
        ? { id: full.id, name: full.name, date: full.date, details: full.details }
        : { id: entry.id, name: entry.name, date: entry.date, details: "" };
    })
  );

  return NextResponse.json(events);
}
