import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: { userId: session.userId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: "All marked as read" });
    }

    if (notificationId) {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId: session.userId },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Notification update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
