import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { assertRole } from "@/server/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getSession();
  // Strictly ADMIN only! HR and Employee get 403 Forbidden!
  const auth = assertRole(session, ["ADMIN"]);
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "";
  const entityType = searchParams.get("entityType") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, parseInt(searchParams.get("limit") || "20", 10));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    companyId: auth.session.companyId,
    ...(action ? { action: { contains: action } } : {}),
    ...(entityType ? { entityType } : {}),
  };

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
