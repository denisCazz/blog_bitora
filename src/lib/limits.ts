import { prisma } from "@/lib/prisma";
import type { User } from "@/generated/prisma/client";

interface LimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
}

const AI_LIMITS: Record<string, number> = {
  READER: 2,
  PLUS: 6,
  CREATOR: 999, // unlimited AI searches for draft generation
  ADMIN: 999,
};

const CREATOR_MONTHLY_LIMIT = 12;

function isNewDay(resetDate: Date): boolean {
  const now = new Date();
  return (
    now.getFullYear() !== resetDate.getFullYear() ||
    now.getMonth() !== resetDate.getMonth() ||
    now.getDate() !== resetDate.getDate()
  );
}

function isNewMonth(resetDate: Date): boolean {
  const now = new Date();
  return (
    now.getFullYear() !== resetDate.getFullYear() ||
    now.getMonth() !== resetDate.getMonth()
  );
}

export function checkAILimit(user: User): LimitResult {
  const limit = AI_LIMITS[user.role] ?? 2;

  // If it's a new day, usage is effectively 0
  const used = isNewDay(user.aiArticlesResetDate)
    ? 0
    : user.aiArticlesUsedToday;

  return {
    allowed: used < limit,
    remaining: Math.max(0, limit - used),
    limit,
  };
}

export function checkCreatorLimit(user: User): LimitResult {
  if (user.role !== "CREATOR") {
    return { allowed: false, remaining: 0, limit: 0 };
  }

  const used = isNewMonth(user.creatorArticlesResetDate)
    ? 0
    : user.creatorArticlesUsedMonth;

  return {
    allowed: used < CREATOR_MONTHLY_LIMIT,
    remaining: Math.max(0, CREATOR_MONTHLY_LIMIT - used),
    limit: CREATOR_MONTHLY_LIMIT,
  };
}

export async function incrementAIUsage(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  if (isNewDay(user.aiArticlesResetDate)) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        aiArticlesUsedToday: 1,
        aiArticlesResetDate: new Date(),
      },
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: {
        aiArticlesUsedToday: { increment: 1 },
      },
    });
  }
}

export async function incrementCreatorUsage(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  if (isNewMonth(user.creatorArticlesResetDate)) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        creatorArticlesUsedMonth: 1,
        creatorArticlesResetDate: new Date(),
      },
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: {
        creatorArticlesUsedMonth: { increment: 1 },
      },
    });
  }
}
