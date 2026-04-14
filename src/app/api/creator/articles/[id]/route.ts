import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { createSlug, estimateReadingTime } from "@/lib/utils";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["CREATOR", "ADMIN"]);
    const { id } = await params;

    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) {
      return NextResponse.json(
        { error: "Articolo non trovato" },
        { status: 404 }
      );
    }

    if (user.role !== "ADMIN" && article.authorId !== user.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.title && typeof body.title === "string") {
      updateData.title = body.title.trim().slice(0, 500);
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
    if (body.summary !== undefined) {
      updateData.summary = (body.summary || "").trim().slice(0, 2000);
    }
    if (body.content && typeof body.content === "string") {
      updateData.content = body.content;
      updateData.readingTime = estimateReadingTime(body.content);
    }
    if (body.category) updateData.category = body.category;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.visibility) updateData.visibility = body.visibility;
    if (body.isDraft !== undefined) {
      updateData.isDraft = body.isDraft;
      updateData.published = !body.isDraft;
    }

    const updated = await prisma.article.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ article: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }
    return NextResponse.json({ error: "Errore server" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["CREATOR", "ADMIN"]);
    const { id } = await params;

    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) {
      return NextResponse.json(
        { error: "Articolo non trovato" },
        { status: 404 }
      );
    }

    if (user.role !== "ADMIN" && article.authorId !== user.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    await prisma.article.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }
    return NextResponse.json({ error: "Errore server" }, { status: 500 });
  }
}
