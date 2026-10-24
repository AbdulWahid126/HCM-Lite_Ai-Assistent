import { NextResponse } from "next/server";
import { getSession, hashPassword, generateTemporaryPassword } from "@/lib/auth";
import { assertRole } from "@/server/permissions";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/server/services/audit";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email("Valid email required"),
  role: z.enum(["ADMIN", "HR"]),
  password: z.string().min(8).optional(),
});

const updateUserSchema = z.object({
  userId: z.string(),
  isActive: z.boolean().optional(),
  resetPassword: z.boolean().optional(),
});

export async function GET() {
  const session = await getSession();
  const auth = assertRole(session, ["ADMIN"]);
  if (!auth.authorized) return auth.response;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      lastLoginAt: true,
      createdAt: true,
      employee: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await getSession();
  const auth = assertRole(session, ["ADMIN"]);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { email, role, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    const tempPassword = password || generateTemporaryPassword();
    const passwordHash = await hashPassword(tempPassword);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        isActive: true,
        mustChangePassword: true,
      },
    });

    await createAuditLog({
      session,
      action: "USER_ACCOUNT_CREATED",
      entityType: "User",
      entityId: newUser.id,
      details: { email, role, mustChangePassword: true },
    });

    return NextResponse.json({
      success: true,
      user: { id: newUser.id, email: newUser.email, role: newUser.role },
      temporaryPassword: tempPassword,
    });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getSession();
  const auth = assertRole(session, ["ADMIN"]);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { userId, isActive, resetPassword } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent deactivating own account
    if (auth.session.userId === userId && isActive === false) {
      return NextResponse.json({ error: "You cannot deactivate your own account" }, { status: 400 });
    }

    let temporaryPassword = null;
    let passwordHash = undefined;
    let mustChangePassword = undefined;

    if (resetPassword) {
      temporaryPassword = generateTemporaryPassword();
      passwordHash = await hashPassword(temporaryPassword);
      mustChangePassword = true;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(isActive !== undefined ? { isActive } : {}),
        ...(passwordHash ? { passwordHash, mustChangePassword } : {}),
      },
      select: { id: true, email: true, role: true, isActive: true, mustChangePassword: true },
    });

    await createAuditLog({
      session,
      action: "USER_ACCOUNT_UPDATED",
      entityType: "User",
      entityId: user.id,
      details: { isActive, passwordReset: !!resetPassword },
    });

    return NextResponse.json({
      success: true,
      user: updated,
      temporaryPassword,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
