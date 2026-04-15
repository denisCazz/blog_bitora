import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const start = Date.now();
  try {
    // Simple connectivity check — no auth required
    await prisma.user.count();
    return NextResponse.json({ ok: true, latency: Date.now() - start });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 503 }
    );
  }
}
