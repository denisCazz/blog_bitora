import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateArticlesFromTrends } from "@/lib/ai";
import { createSlug, estimateReadingTime } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    // Simple API key auth for cron jobs
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const articles = await generateArticlesFromTrends();
    const created = [];

    for (const generated of articles) {
      try {
        let slug = createSlug(generated.title);

        const existingSlug = await prisma.article.findUnique({
          where: { slug },
        });
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
          },
        });

        created.push(article.id);
      } catch (error) {
        console.error("Failed to create article:", error);
      }
    }

    return NextResponse.json({
      message: `Generated ${created.length} articles`,
      ids: created,
    });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Errore durante la generazione" },
      { status: 500 }
    );
  }
}
