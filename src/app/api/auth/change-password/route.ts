import { NextResponse } from "next/server";
import { getSession, hashPassword, verifyPassword, signSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/server/services/audit";
import { z } from "zod";

const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If not a mandatory password change on first login, verify current password
    if (!user.mustChangePassword && currentPassword) {
      const isValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
      }
    }

    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
      },
    });

    // Refresh token with mustChangePassword: false
    const updatedToken = await signSessionToken({
      ...session,
      mustChangePassword: false,
    });

    const response = NextResponse.json({
      success: true,
      message: "Password updated successfully",
      redirectUrl: session.role === "ADMIN" ? "/admin" : session.role === "HR" ? "/hr" : "/employee",
    });

    response.cookies.set(AUTH_COOKIE_NAME, updatedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    await createAuditLog({
      session,
      action: "PASSWORD_CHANGED",
      entityType: "User",
      entityId: user.id,
      details: { email: user.email },
    });

    return response;
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
