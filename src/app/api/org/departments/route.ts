import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { assertRole } from "@/server/permissions";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/server/services/audit";
import { z } from "zod";

const deptSchema = z.object({
  name: z.string().min(2, "Department name is required"),
  code: z.string().optional(),
  description: z.string().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const departments = await prisma.department.findMany({
    where: { companyId: session.companyId },
    include: {
      _count: { select: { employees: true, designations: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(departments);
}

export async function POST(req: Request) {
  const session = await getSession();
  const auth = assertRole(session, ["ADMIN"]);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const parsed = deptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { name, code, description } = parsed.data;

    const existing = await prisma.department.findFirst({
      where: { companyId: auth.session.companyId, name },
    });
    if (existing) {
      return NextResponse.json({ error: "A department with this name already exists" }, { status: 409 });
    }

    const department = await prisma.department.create({
      data: {
        companyId: auth.session.companyId,
        name,
        code,
        description,
      },
    });

    await createAuditLog({
      session,
      action: "DEPARTMENT_CREATED",
      entityType: "Department",
      entityId: department.id,
      details: { name, code },
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    console.error("Create department error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
