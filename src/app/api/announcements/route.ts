import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { assertRole } from "@/server/permissions";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/server/services/audit";
import { z } from "zod";

const announcementSchema = z.object({
  title: z.string().min(2, "Title is required"),
  content: z.string().min(5, "Content is required"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  targetRole: z.enum(["ALL", "HR", "EMPLOYEE"]).default("ALL"),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const announcements = await prisma.announcement.findMany({
    where: {
      companyId: session.companyId,
      targetRole: { in: ["ALL", session.role] },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(announcements);
}

export async function POST(req: Request) {
  const session = await getSession();
  const auth = assertRole(session, ["ADMIN", "HR"]);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const parsed = announcementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { title, content, priority, targetRole } = parsed.data;

    const announcement = await prisma.announcement.create({
      data: {
        companyId: auth.session.companyId,
        authorId: auth.session.userId,
        title,
        content,
        priority,
        targetRole,
      },
    });

    await createAuditLog({
      session: auth.session,
      action: "ANNOUNCEMENT_POSTED",
      entityType: "Announcement",
      entityId: announcement.id,
      details: { title, priority, targetRole },
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("Create announcement error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
