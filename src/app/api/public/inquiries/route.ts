import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/data";
import { generateId } from "@/lib/utils";
import { writeAuditLog } from "@/lib/audit";
import type { Inquiry, InquiryIndexEntry } from "@/types/inquiry";

// Simple in-memory rate limiter (resets on server restart)
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;

  entry.count++;
  return true;
}

const inquirySchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  phone: z
    .string()
    .min(10, "Valid phone number required")
    .max(15)
    .regex(/^[0-9+\-\s]+$/, "Invalid phone number"),
  email: z.string().email("Invalid email").max(200).or(z.literal("")),
  eventType: z.string().min(1, "Event type is required").max(50),
  preferredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  guestsEstimate: z.number().int().min(1).max(10000),
  hallPreference: z.string().max(100).optional().default(""),
  roomsNeeded: z.boolean().optional().default(false),
  message: z.string().max(1000).optional().default(""),
});

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const store = getStore();

  // Generate unique ID
  const existingIndex = await store.list<InquiryIndexEntry>("inquiries");
  const existingIds = existingIndex.map((e) => e.id);
  const id = generateId("INQ", existingIds);

  const now = new Date().toISOString();

  const inquiry: Inquiry = {
    id,
    source: "website",
    submittedAt: now,
    name: data.name,
    phone: data.phone,
    email: data.email,
    eventType: data.eventType,
    preferredDate: data.preferredDate,
    guestsEstimate: data.guestsEstimate,
    hallPreference: data.hallPreference,
    roomsNeeded: data.roomsNeeded,
    message: data.message,
    status: "new",
    followUps: [],
    quotedAmount: 0,
    convertedToBookingId: "",
    lostReason: "",
    assignedTo: "admin",
    createdAt: now,
    updatedAt: now,
  };

  const indexEntry: InquiryIndexEntry = {
    id,
    name: data.name,
    phone: data.phone,
    eventType: data.eventType,
    preferredDate: data.preferredDate,
    status: "new",
    submittedAt: now,
    quotedAmount: 0,
  };

  await store.put("inquiries", id, inquiry, indexEntry);

  await writeAuditLog({
    action: "create",
    entity: "inquiry",
    entityId: id,
    actorId: ip,
    actorName: "Website Visitor",
    source: "public",
    summary: `Public inquiry submitted by ${data.name}`,
    details: {
      eventType: data.eventType,
      preferredDate: data.preferredDate,
      guestsEstimate: data.guestsEstimate,
      phone: data.phone,
    },
  });

  return NextResponse.json(
    {
      success: true,
      message:
        "Thank you for your inquiry! Our team will contact you within 24 hours.",
      id,
    },
    { status: 201 }
  );
}
