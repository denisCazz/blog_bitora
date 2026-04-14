import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const comments = await prisma.comment.findMany({
    where: { articleId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(comments);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { author, content } = await request.json();

    if (
      !author ||
      typeof author !== "string" ||
      author.trim().length < 1 ||
      author.trim().length > 100
    ) {
      return NextResponse.json(
        { error: "Nome non valido (1-100 caratteri)" },
        { status: 400 }
      );
    }

    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length < 2 ||
      content.trim().length > 2000
    ) {
      return NextResponse.json(
        { error: "Commento non valido (2-2000 caratteri)" },
        { status: 400 }
      );
    }

    // Verify article exists
    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) {
      return NextResponse.json(
        { error: "Articolo non trovato" },
        { status: 404 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        articleId: id,
        author: author.trim().slice(0, 100),
        content: content.trim().slice(0, 2000),
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Comment error:", error);
    return NextResponse.json(
      { error: "Errore durante il salvataggio del commento" },
      { status: 500 }
    );
  }
}
