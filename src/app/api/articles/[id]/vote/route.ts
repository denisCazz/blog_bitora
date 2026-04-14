import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function getFingerprint(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const ua = request.headers.get("user-agent") || "unknown";
  return crypto.createHash("sha256").update(`${ip}:${ua}`).digest("hex").slice(0, 64);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const fingerprint = getFingerprint(request);

  const article = await prisma.article.findUnique({
    where: { id },
    select: { upvotes: true },
  });

  const existingVote = await prisma.vote.findUnique({
    where: { articleId_fingerprint: { articleId: id, fingerprint } },
  });

  return NextResponse.json({
    upvotes: article?.upvotes ?? 0,
    userVote: existingVote?.value ?? 0,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { value } = await request.json();

    if (value !== 1 && value !== -1 && value !== 0) {
      return NextResponse.json(
        { error: "Valore non valido" },
        { status: 400 }
      );
    }

    const fingerprint = getFingerprint(request);

    // Verify article exists
    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) {
      return NextResponse.json(
        { error: "Articolo non trovato" },
        { status: 404 }
      );
    }

    const existingVote = await prisma.vote.findUnique({
      where: { articleId_fingerprint: { articleId: id, fingerprint } },
    });

    let delta = 0;

    if (value === 0 && existingVote) {
      // Remove vote
      delta = -existingVote.value;
      await prisma.vote.delete({
        where: { id: existingVote.id },
      });
    } else if (existingVote) {
      // Update vote
      delta = value - existingVote.value;
      await prisma.vote.update({
        where: { id: existingVote.id },
        data: { value },
      });
    } else if (value !== 0) {
      // New vote
      delta = value;
      await prisma.vote.create({
        data: { articleId: id, fingerprint, value },
      });
    }

    // Update denormalized upvotes count
    if (delta !== 0) {
      await prisma.article.update({
        where: { id },
        data: { upvotes: { increment: delta } },
      });
    }

    const updated = await prisma.article.findUnique({
      where: { id },
      select: { upvotes: true },
    });

    return NextResponse.json({
      upvotes: updated?.upvotes ?? 0,
      userVote: value,
    });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json(
      { error: "Errore durante il voto" },
      { status: 500 }
    );
  }
}
