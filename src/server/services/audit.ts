import { prisma } from "@/lib/prisma";
import { UserSession } from "@/lib/auth";

export interface LogAuditOptions {
  session?: UserSession | null;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown> | string;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(options: LogAuditOptions) {
  try {
    const actorEmail = options.actorEmail ?? options.session?.email ?? "system";
    const actorRole = options.actorRole ?? options.session?.role ?? "SYSTEM";
    const companyId = options.session?.companyId ?? undefined;
    const userId = options.session?.userId ?? undefined;

    const detailsStr =
      typeof options.details === "object"
        ? JSON.stringify(options.details)
        : options.details ?? null;

    await prisma.auditLog.create({
      data: {
        companyId,
        userId,
        actorEmail,
        actorRole,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId,
        details: detailsStr,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      },
    });
  } catch (error) {
    console.error("Failed to write immutable audit log:", error);
    // Audit write error shouldn't crash unhandled but logged
  }
}
