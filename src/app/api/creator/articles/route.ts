import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { checkCreatorLimit, incrementCreatorUsage } from "@/lib/limits";
import { createSlug, estimateReadingTime } from "@/lib/utils";

export async function GET() {
  try {
    const user = await requireRole(["CREATOR", "ADMIN"]);

    const where =
      user.role === "ADMIN" ? {} : { authorId: user.id };

    const articles = await prisma.article.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        upvotes: true,
        published: true,
        isDraft: true,
        visibility: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ articles });
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

export async function POST(request: Request) {
  try {
    const user = await requireRole(["CREATOR", "ADMIN"]);

    // Check creator limit (not for admin)
    if (user.role === "CREATOR") {
      const limit = checkCreatorLimit(user);
      if (!limit.allowed) {
        return NextResponse.json(
          { error: "Hai raggiunto il limite mensile di 12 articoli" },
          { status: 429 }
        );
      }
    }

    const body = await request.json();
    const { title, summary, content, category, tags, visibility, isDraft } =
      body;

    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return NextResponse.json(
        { error: "Titolo richiesto (min 3 caratteri)" },
        { status: 400 }
      );
    }
    if (!content || typeof content !== "string" || content.trim().length < 10) {
      return NextResponse.json(
        { error: "Contenuto richiesto" },
        { status: 400 }
      );
    }

    let slug = createSlug(title.trim());
    const existingSlug = await prisma.article.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const tagsStr =
      typeof tags === "string"
        ? JSON.stringify(
            tags
              .split(",")
              .map((t: string) => t.trim())
              .filter(Boolean)
          )
        : "[]";

    const article = await prisma.article.create({
      data: {
        title: title.trim().slice(0, 500),
        slug,
        summary: (summary || "").trim().slice(0, 2000),
        content: content.trim(),
        category: category || "Software",
        tags: tagsStr,
        readingTime: estimateReadingTime(content),
        visibility: visibility === "PROFILE_ONLY" ? "PROFILE_ONLY" : "PUBLIC",
        isDraft: isDraft === true,
        published: isDraft !== true,
        authorId: user.id,
      },
    });

    // Increment creator usage only for published articles
    if (!isDraft && user.role === "CREATOR") {
      await incrementCreatorUsage(user.id);
    }

    return NextResponse.json({ article });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }
    console.error("Creator article error:", error);
    return NextResponse.json({ error: "Errore server" }, { status: 500 });
  }
}
