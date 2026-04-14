import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkAILimit, checkCreatorLimit } from "@/lib/limits";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const aiLimit = checkAILimit(user);
    const creatorLimit =
      user.role === "CREATOR" ? checkCreatorLimit(user) : null;

    type ArticleRow = {
      id: string;
      title: string;
      slug: string;
      category: string;
      upvotes: number;
      published: boolean;
      isDraft: boolean;
      visibility: string;
      createdAt: Date;
    };

    // Get articles based on role
    let articles: ArticleRow[] = [];
    if (user.role === "ADMIN") {
      articles = await prisma.article.findMany({
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
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    } else if (user.role === "CREATOR") {
      articles = await prisma.article.findMany({
        where: { authorId: user.id },
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
        orderBy: { createdAt: "desc" },
      });
    } else {
      articles = [];
    }

    return NextResponse.json({
      articles,
      aiLimit: { remaining: aiLimit.remaining, limit: aiLimit.limit },
      creatorLimit: creatorLimit
        ? { remaining: creatorLimit.remaining, limit: creatorLimit.limit }
        : null,
    });
  } catch {
    return NextResponse.json(
      { error: "Errore caricamento dashboard" },
      { status: 500 }
    );
  }
}
