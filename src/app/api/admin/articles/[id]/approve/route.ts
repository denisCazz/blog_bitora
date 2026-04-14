import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { incrementCreatorUsage } from "@/lib/limits";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN"]);

    const { id } = await params;
    const body = await request.json();
    const { action } = body; // "approve" | "reject"

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Azione non valida" }, { status: 400 });
    }

    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) {
      return NextResponse.json({ error: "Articolo non trovato" }, { status: 404 });
    }

    if (action === "approve") {
      await prisma.article.update({
        where: { id },
        data: { status: "PUBLISHED", published: true, isDraft: false },
      });
      // Increment creator usage if the article has an author
      if (article.authorId) {
        await incrementCreatorUsage(article.authorId);
      }
    } else {
      await prisma.article.update({
        where: { id },
        data: { status: "DRAFT", published: false, isDraft: true },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }
    console.error("Approve article error:", error);
    return NextResponse.json({ error: "Errore server" }, { status: 500 });
  }
}
