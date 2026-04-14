import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Single article by slug (for edit page)
  const slug = searchParams.get("slug");
  if (slug) {
    const article = await prisma.article.findUnique({
      where: { slug },
    });
    if (!article) {
      return NextResponse.json({ error: "Non trovato" }, { status: 404 });
    }
    return NextResponse.json({ article });
  }

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const category = searchParams.get("category");

  const where = {
    published: true,
    isDraft: false,
    visibility: "PUBLIC" as const,
    ...(category ? { category } : {}),
  };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        imageUrl: true,
        category: true,
        tags: true,
        readingTime: true,
        promoted: true,
        createdAt: true,
      },
    }),
    prisma.article.count({ where }),
  ]);

  return NextResponse.json({
    articles,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}
