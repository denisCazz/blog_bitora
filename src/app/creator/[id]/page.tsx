import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const creator = await prisma.user.findUnique({
    where: { id, role: "CREATOR" },
    select: { id: true, name: true, createdAt: true },
  });

  if (!creator) notFound();

  const articles = await prisma.article.findMany({
    where: {
      authorId: creator.id,
      published: true,
      isDraft: false,
      visibility: "PUBLIC",
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      category: true,
      readingTime: true,
      upvotes: true,
      createdAt: true,
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xl font-bold text-purple-400">
          {creator.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{creator.name}</h1>
          <p className="text-sm text-gray-500">
            Creator dal {formatDate(creator.createdAt)} · {articles.length}{" "}
            articol{articles.length === 1 ? "o" : "i"}
          </p>
        </div>
      </div>

      {articles.length === 0 ? (
        <p className="text-gray-500 text-center py-12">
          Nessun articolo pubblicato ancora
        </p>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/articolo/${article.slug}`}
              className="block bg-gray-900/50 rounded-2xl border border-gray-800/60 p-5 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-white mb-1">
                    {article.title}
                  </h2>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {article.summary}
                  </p>
                  <div className="flex items-center gap-3 mt-2.5">
                    <span className="text-xs text-gray-500">
                      {article.category}
                    </span>
                    <span className="text-xs text-gray-600">
                      {article.readingTime} min
                    </span>
                    <span className="text-xs text-gray-600">
                      ↑ {article.upvotes}
                    </span>
                    <span className="text-xs text-gray-600">
                      {formatDate(article.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
