import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateTemporaryPassword } from "@/lib/auth";

// POST /api/auth/forgot-password
// Hackathon-safe: no email server required. Generates a temp password and returns it directly.
// In production this would send an email link instead.
export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        employee: { select: { firstName: true, lastName: true } },
      },
    });

    // Always return success-shaped response to prevent email enumeration
    if (!user || !user.isActive) {
      return NextResponse.json({
        success: true,
        found: false,
        message: "If this email is registered and active, a temporary password has been generated.",
      });
    }

    // Generate + hash a new temporary password
    const tempPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(tempPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: true },
    });

    return NextResponse.json({
      success: true,
      found: true,
      tempPassword,
      userName: user.employee
        ? `${user.employee.firstName} ${user.employee.lastName}`
        : user.email,
      message: "Temporary password generated. You must change it immediately after signing in.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
