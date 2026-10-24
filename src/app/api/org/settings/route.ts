import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { assertRole } from "@/server/permissions";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/server/services/audit";
import { z } from "zod";

const settingsUpdateSchema = z.object({
  officeStartTime: z.string().regex(/^\d{2}:\d{2}$/, "Format must be HH:mm"),
  gracePeriodMins: z.number().min(0).max(120),
  halfDayHours: z.number().min(1).max(12),
  weekendDays: z.string().min(3),
  officeLatitude: z.number().nullable().optional(),
  officeLongitude: z.number().nullable().optional(),
  geofenceRadius: z.number().min(10).max(10000),
  latePenaltyEnabled: z.boolean().optional(),
  latePenaltyCount: z.number().min(1).max(10).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const company = await prisma.company.findFirst({
    include: {
      settings: true,
      leaveTypes: true,
      publicHolidays: true,
      departments: true,
    },
  });

  return NextResponse.json(company);
}

export async function PUT(req: Request) {
  const session = await getSession();
  const auth = assertRole(session, ["ADMIN"]);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const parsed = settingsUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const company = await prisma.company.findFirst({
      include: { settings: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const updated = await prisma.orgSettings.upsert({
      where: { companyId: company.id },
      create: {
        companyId: company.id,
        ...parsed.data,
      },
      update: {
        ...parsed.data,
      },
    });

    await createAuditLog({
      session,
      action: "ORG_SETTINGS_UPDATED",
      entityType: "OrgSettings",
      entityId: updated.id,
      details: { updatedFields: parsed.data },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
