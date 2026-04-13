export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "status-change"
  | "payment"
  | "sync";

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  source: "dashboard" | "api" | "public" | "system";
  summary: string;
  details?: Record<string, unknown>;
}
