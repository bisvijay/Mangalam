import { getStore } from "@/lib/data";
import { generateId } from "@/lib/utils";
import type { AuditAction, AuditLogEntry } from "@/types/audit";

interface AuditInput {
  action: AuditAction;
  entity: string;
  entityId: string;
  actorId?: string;
  actorName?: string;
  source?: AuditLogEntry["source"];
  summary: string;
  details?: Record<string, unknown>;
}

export function getAuditActor(user?: {
  id?: string;
  username?: string;
  name?: string;
} | null): { actorId: string; actorName: string } {
  return {
    actorId: user?.id || user?.username || "system",
    actorName: user?.name || user?.username || "System",
  };
}

export async function writeAuditLog(input: AuditInput): Promise<void> {
  try {
    const store = getStore();
    const existing = await store.list<AuditLogEntry>("audit");
    const id = generateId("AUD", existing.map((entry) => entry.id));
    const entry: AuditLogEntry = {
      id,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      timestamp: new Date().toISOString(),
      actorId: input.actorId || "system",
      actorName: input.actorName || "System",
      source: input.source || "system",
      summary: input.summary,
      details: input.details,
    };

    await store.put("audit", id, entry, entry);
  } catch {
    // Audit should never block business operations
  }
}
