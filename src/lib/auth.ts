import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { User, UserRole } from "@/generated/prisma/client";

const COOKIE_NAME = "session_token";
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(64).toString("hex");
  const expiresAt = new Date(Date.now() + MAX_AGE * 1000);

  await prisma.session.create({
    data: { userId, token, expiresAt },
  });

  return token;
}

export async function getSession(
  token: string
): Promise<(User & { sessions?: never }) | null> {
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return getSession(token);
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireRole(roles: UserRole[]): Promise<User> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) throw new Error("Forbidden");
  return user;
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export { COOKIE_NAME, MAX_AGE };
