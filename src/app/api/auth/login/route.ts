import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { createAuditLog } from "@/server/services/audit";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { email, password } = parsed.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        employee: {
          select: { id: true, companyId: true, firstName: true, lastName: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "This account has been deactivated. Please contact your administrator." },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Determine companyId: from employee or first company
    let companyId = user.employee?.companyId;
    if (!companyId) {
      const company = await prisma.company.findFirst();
      companyId = company?.id || "";
    }

    // Sign session token
    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role as "ADMIN" | "HR" | "EMPLOYEE",
      companyId,
      employeeId: user.employee?.id || null,
      mustChangePassword: user.mustChangePassword,
    });

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Determine redirect path
    let redirectUrl = "/admin";
    if (user.role === "HR") redirectUrl = "/hr";
    else if (user.role === "EMPLOYEE") redirectUrl = "/employee";

    if (user.mustChangePassword) {
      redirectUrl = "/change-password";
    }

    const response = NextResponse.json({
      success: true,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      redirectUrl,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user.role,
      },
    });

    // Set HTTP-only cookie
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    await createAuditLog({
      session: {
        userId: user.id,
        email: user.email,
        role: user.role as "ADMIN" | "HR" | "EMPLOYEE",
        companyId,
      },
      action: "USER_LOGGED_IN",
      entityType: "User",
      entityId: user.id,
      details: { role: user.role, email: user.email },
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error during login" }, { status: 500 });
  }
}
