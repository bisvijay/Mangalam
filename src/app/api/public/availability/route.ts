import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import type { BookingIndexEntry } from "@/types/booking";
import type { HallConfig } from "@/types/config";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");
  const hallId = searchParams.get("hall");

  if (!date) {
    return NextResponse.json(
      { error: "Date parameter is required" },
      { status: 400 }
    );
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD" },
      { status: 400 }
    );
  }

  const store = getStore();

  // Get all halls
  const halls = await store.getConfig<HallConfig[]>("halls/config.json");
  if (!halls) {
    return NextResponse.json(
      { error: "Configuration error" },
      { status: 500 }
    );
  }

  // Get booking index to check for conflicts
  const bookings = await store.list<BookingIndexEntry>("bookings");
  const activeStatuses = ["confirmed", "in-progress"];

  // Check availability for each hall (or specific hall)
  const hallsToCheck = hallId
    ? halls.filter((h) => h.id === hallId)
    : halls.filter((h) => h.available);

  const availability = hallsToCheck.map((hall) => {
    const isBooked = bookings.some(
      (b) =>
        b.hallId === hall.id &&
        activeStatuses.includes(b.status) &&
        b.eventDate === date
    );

    return {
      hallId: hall.id,
      hallName: hall.name,
      type: hall.type,
      capacity: hall.capacity,
      available: !isBooked,
    };
  });

  const anyAvailable = availability.some((h) => h.available);

  return NextResponse.json({
    date,
    status: anyAvailable ? "available" : "fully-booked",
    halls: availability,
  });
}
