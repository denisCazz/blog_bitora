import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchAndGenerate } from "@/lib/ai";
import { createSlug, estimateReadingTime } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { checkAILimit, incrementAIUsage } from "@/lib/limits";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, type } = body;

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Query non valida" },
        { status: 400 }
      );
    }

    const sanitizedQuery = query.trim().slice(0, 200);

    // Log the search
    await prisma.searchLog.create({
      data: { query: sanitizedQuery },
    });

    // Basic text search — available to everyone, no AI
    if (type === "basic") {
      const articles = await prisma.article.findMany({
        where: {
          published: true,
          isDraft: false,
          visibility: "PUBLIC",
          OR: [
            { title: { contains: sanitizedQuery } },
            { tags: { contains: sanitizedQuery.toLowerCase() } },
            { summary: { contains: sanitizedQuery } },
          ],
        },
        take: 10,
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ articles, cached: true });
    }

    // AI-powered search — requires user + limit check
    const user = await getCurrentUser();

    if (!user) {
      // Not logged in: only do basic search of existing articles
      const articles = await prisma.article.findMany({
        where: {
          published: true,
          isDraft: false,
          visibility: "PUBLIC",
          OR: [
            { title: { contains: sanitizedQuery } },
            { tags: { contains: sanitizedQuery.toLowerCase() } },
            { summary: { contains: sanitizedQuery } },
          ],
        },
        take: 10,
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ articles, cached: true, limitedMode: true });
    }

    // Check AI limit
    const limitResult = checkAILimit(user);
    if (!limitResult.allowed) {
      return NextResponse.json(
        {
          error: "Hai raggiunto il limite giornaliero di articoli AI",
          remaining: 0,
          limit: limitResult.limit,
        },
        { status: 429 }
      );
    }

    // Check if we already have recent articles about this topic
    const existing = await prisma.article.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: sanitizedQuery } },
          { tags: { contains: sanitizedQuery.toLowerCase() } },
        ],
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      take: 3,
      orderBy: { createdAt: "desc" },
    });

    if (existing.length >= 2) {
      return NextResponse.json({
        articles: existing,
        cached: true,
        remaining: limitResult.remaining,
      });
    }

    // Generate multiple articles with AI
    const generatedArticles = await searchAndGenerate(sanitizedQuery, user.searchPreference ?? undefined);
    const created = [];

    for (const generated of generatedArticles) {
      try {
        let slug = createSlug(generated.title);
        const existingSlug = await prisma.article.findUnique({ where: { slug } });
        if (existingSlug) {
          slug = `${slug}-${Date.now()}`;
        }

        const article = await prisma.article.create({
          data: {
            title: generated.title,
            slug,
            summary: generated.summary,
            content: generated.content,
            category: generated.category,
            tags: JSON.stringify(generated.tags),
            readingTime: estimateReadingTime(generated.content),
            promoted: generated.promoted,
            generatedByUserId: user.id,
          },
        });
        created.push(article);
      } catch (err) {
        console.error("Failed to save article:", err);
      }
    }

    // Increment AI usage
    await incrementAIUsage(user.id);

    // Update search log
    await prisma.searchLog.updateMany({
      where: { query: sanitizedQuery },
      data: { results: created.length },
    });

    return NextResponse.json({
      articles: created,
      cached: false,
      remaining: limitResult.remaining - 1,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Errore durante la generazione degli articoli" },
      { status: 500 }
    );
  }
}
