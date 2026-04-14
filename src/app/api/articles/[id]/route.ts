import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createSlug, estimateReadingTime } from "@/lib/utils";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) {
      return NextResponse.json(
        { error: "Articolo non trovato" },
        { status: 404 }
      );
    }

    // Allow edit if admin, or if user is the author
    const isAdmin = user.role === "ADMIN";
    const isAuthor = article.authorId === user.id;
    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};

    if (body.title && typeof body.title === "string") {
      updateData.title = body.title.trim().slice(0, 500);
      // Update slug if title changed
      if (body.title.trim() !== article.title) {
        let newSlug = createSlug(body.title.trim());
        const existingSlug = await prisma.article.findUnique({
          where: { slug: newSlug },
        });
        if (existingSlug && existingSlug.id !== id) {
          newSlug = `${newSlug}-${Date.now()}`;
        }
        updateData.slug = newSlug;
      }
    }

    if (body.summary && typeof body.summary === "string") {
      updateData.summary = body.summary.trim().slice(0, 2000);
    }

    if (body.content && typeof body.content === "string") {
      updateData.content = body.content;
      updateData.readingTime = estimateReadingTime(body.content);
    }

    if (body.category && typeof body.category === "string") {
      updateData.category = body.category.trim().slice(0, 100);
    }

    if (body.tags && typeof body.tags === "string") {
      updateData.tags = body.tags;
    }

    const updated = await prisma.article.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ article: updated });
  } catch (error) {
    console.error("Update article error:", error);
    return NextResponse.json(
      { error: "Errore durante l'aggiornamento" },
      { status: 500 }
    );
  }
}
