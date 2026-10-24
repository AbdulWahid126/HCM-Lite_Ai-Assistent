import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { assertRole } from "@/server/permissions";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/server/services/audit";
import { z } from "zod";

const designationSchema = z.object({
  title: z.string().min(2, "Designation title is required"),
  departmentId: z.string().optional(),
  description: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get("departmentId");

  const designations = await prisma.designation.findMany({
    where: {
      companyId: session.companyId,
      ...(departmentId ? { departmentId } : {}),
    },
    include: {
      department: true,
      _count: { select: { employees: true } },
    },
    orderBy: { title: "asc" },
  });

  return NextResponse.json(designations);
}

export async function POST(req: Request) {
  const session = await getSession();
  const auth = assertRole(session, ["ADMIN"]);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const parsed = designationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { title, departmentId, description } = parsed.data;

    const existing = await prisma.designation.findFirst({
      where: { companyId: auth.session.companyId, title },
    });
    if (existing) {
      return NextResponse.json({ error: "A designation with this title already exists" }, { status: 409 });
    }

    const designation = await prisma.designation.create({
      data: {
        companyId: auth.session.companyId,
        departmentId: departmentId || null,
        title,
        description,
      },
    });

    await createAuditLog({
      session,
      action: "DESIGNATION_CREATED",
      entityType: "Designation",
      entityId: designation.id,
      details: { title, departmentId },
    });

    return NextResponse.json(designation, { status: 201 });
  } catch (error) {
    console.error("Create designation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
