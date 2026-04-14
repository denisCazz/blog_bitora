import Link from "next/link";
import { formatDate, getCategoryColor, getCategoryEmoji } from "@/lib/utils";
import { parseTags } from "@/lib/tags";

interface ArticleCardProps {
  article: {
    slug: string;
    title: string;
    summary: string;
    category: string;
    tags: string | string[];
    readingTime: number;
    upvotes?: number;
    promoted: boolean;
    createdAt: string | Date;
  };
  featured?: boolean;
}

export default function ArticleCard({
  article,
  featured = false,
}: ArticleCardProps) {
  const categoryColor = getCategoryColor(article.category);
  const categoryEmoji = getCategoryEmoji(article.category);
  const tags = parseTags(article.tags);

  if (featured) {
    return (
      <Link href={`/articolo/${article.slug}`} className="group block">
        <article className="article-card-featured relative overflow-hidden rounded-2xl border transition-all duration-300"
          style={{
            background: "linear-gradient(135deg, rgba(15,15,35,0.95), rgba(20,20,45,0.9))",
          }}
        >
          {/* Nebula glow top right */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", filter: "blur(30px)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-gray-950/20 to-transparent" />
          <div className="relative p-5 sm:p-8 md:p-12">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={`${categoryColor} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
                {categoryEmoji} {article.category}
              </span>
              <span className="text-gray-400 text-sm">{formatDate(article.createdAt)}</span>
              <span className="text-gray-500 text-sm">{article.readingTime} min lettura</span>
              {article.promoted && (
                <span className="text-indigo-400 text-xs font-medium px-2 py-0.5 rounded-full border border-indigo-400/30">
                  ✨ Consigliato
                </span>
              )}
              {(article.upvotes ?? 0) > 0 && (
                <span className="text-sky-400 text-xs font-medium flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  {article.upvotes}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-white mb-4 group-hover:text-indigo-300 transition-colors duration-300 line-clamp-2">
              {article.title}
            </h2>
            <p className="text-gray-300 text-lg line-clamp-3 max-w-3xl">
              {article.summary}
            </p>
            <div className="flex flex-wrap gap-2 mt-6">
              {tags.slice(0, 4).map((tag) => (
                <span key={tag} className="text-xs text-indigo-300/60 bg-indigo-500/10 border border-indigo-500/10 px-2 py-1 rounded-md">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/articolo/${article.slug}`} className="group block">
      <article
        className="article-card h-full rounded-xl border transition-all duration-300 overflow-hidden flex flex-col"
        style={{
          background: "linear-gradient(145deg, rgba(13,13,28,0.95), rgba(18,18,35,0.9))",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="p-6 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className={`${categoryColor} text-white text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
              {categoryEmoji} {article.category}
            </span>
            {article.promoted && (
              <span className="text-indigo-400 text-xs">✨</span>
            )}
          </div>
          <h3 className="text-base font-semibold text-white mb-2 group-hover:text-indigo-300 transition-colors duration-200 line-clamp-2">
            {article.title}
          </h3>
          <p className="text-gray-400 text-sm line-clamp-3 flex-1">
            {article.summary}
          </p>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800/60">
            <span className="text-gray-500 text-xs">{formatDate(article.createdAt)}</span>
            <div className="flex items-center gap-3">
              {(article.upvotes ?? 0) > 0 && (
                <span className="text-sky-400 text-xs flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  {article.upvotes}
                </span>
              )}
              <span className="text-gray-500 text-xs">{article.readingTime} min</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
