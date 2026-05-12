import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, SESSION_TTL_DAYS } from "@/lib/auth/constants";
import { prisma } from "@/server/db/client";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: "ADMIN" | "RESPONSABLE" | "SECRETAIRE" | "PRATICIEN" | "ASSISTANTE";
};

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function expirationDate(): Date {
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_TTL_DAYS);
  return expires;
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSessionForUser(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const tokenHash = sha256(token);
  const expiresAt = expirationDate();

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function getUserBySessionToken(token: string): Promise<AuthUser | null> {
  const tokenHash = sha256(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { tokenHash } }).catch(() => undefined);
    return null;
  }

  await prisma.session.update({
    where: { tokenHash },
    data: { lastSeenAt: new Date() },
  });

  return session.user;
}

export async function invalidateSessionToken(token: string): Promise<void> {
  const tokenHash = sha256(token);
  await prisma.session.deleteMany({ where: { tokenHash } });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return getUserBySessionToken(token);
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function getApiUser(request: NextRequest): Promise<AuthUser | null> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return getUserBySessionToken(token);
}
