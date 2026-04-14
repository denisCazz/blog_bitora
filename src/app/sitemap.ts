import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await prisma.article.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
  });

  const articleUrls = articles.map((article) => ({
    url: `https://blog.bitora.it/articolo/${article.slug}`,
    lastModified: article.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: "https://blog.bitora.it",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...articleUrls,
  ];
}
