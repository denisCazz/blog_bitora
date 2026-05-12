import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { parseTags } from "@/lib/tags";
import {
  formatDate,
  getCategoryColor,
  getCategoryEmoji,
} from "@/lib/utils";
import VoteButton from "@/components/VoteButton";
import CommentSection from "@/components/CommentSection";
import ShareButtons from "@/components/ShareButtons";
import Image from "next/image";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

async function getArticle(slug: string) {
  const article = await prisma.article.findUnique({
    where: { slug, published: true },
    include: {
      author: {
        select: { id: true, name: true, role: true },
      },
    },
  });
  return article;
}

async function getDraftArticle(slug: string) {
  return prisma.article.findUnique({
    where: { slug },
    include: {
      author: {
        select: { id: true, name: true, role: true },
      },
    },
  });
}

async function getRelatedArticles(category: string, excludeId: string) {
  return prisma.article.findMany({
    where: {
      category,
      published: true,
      id: { not: excludeId },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      slug: true,
      title: true,
      summary: true,
      category: true,
      readingTime: true,
      createdAt: true,
    },
  });
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return { title: "Articolo non trovato" };
  }

  return {
    title: `${article.title} | Blog Bitora`,
    description: article.summary,
    ...(article.externalUrl ? { alternates: { canonical: article.externalUrl } } : {}),
    openGraph: {
      title: article.title,
      description: article.summary,
      type: "article",
      publishedTime: article.createdAt.toISOString(),
      tags: parseTags(article.tags),
    },
  };
}

function renderMarkdown(content: string): string {
  let html = content
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Horizontal rules
    .replace(/^---+$/gm, '<hr />')
    // Bold and italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-lg max-w-full my-4" />')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Code blocks
    .replace(/```[\s\S]*?```/g, (match) => {
      const code = match.replace(/```\w*\n?/g, '').replace(/```/g, '');
      return `<pre><code>${code}</code></pre>`;
    })
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Blockquotes
    .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
    // Unordered lists
    .replace(/^[\-\*] (.*$)/gm, '<li class="ul">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.*$)/gm, '<li class="ol">$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    // Line breaks
    .replace(/\n/g, '<br/>');

  // Wrap consecutive <li class="ul"> in <ul>
  html = html.replace(/(<li class="ul">.*?<\/li>(\s*<br\/>)*)+/g, (match) => {
    return '<ul>' + match.replace(/<br\/>/g, '').replace(/ class="ul"/g, '') + '</ul>';
  });

  // Wrap consecutive <li class="ol"> in <ol>
  html = html.replace(/(<li class="ol">.*?<\/li>(\s*<br\/>)*)+/g, (match) => {
    return '<ol>' + match.replace(/<br\/>/g, '').replace(/ class="ol"/g, '') + '</ol>';
  });

  return '<p>' + html + '</p>';
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  let article = await getArticle(slug);
  let isDraft = false;

  if (!article) {
    // Check if it's a draft the current user is allowed to preview
    const draft = await getDraftArticle(slug);
    if (draft) {
      const currentUser = await getCurrentUser();
      if (
        currentUser &&
        (currentUser.role === "ADMIN" || draft.authorId === currentUser.id)
      ) {
        article = draft;
        isDraft = true;
      }
    }
  }

  if (!article) {
    notFound();
  }

  const relatedArticles = await getRelatedArticles(
    article.category,
    article.id
  );

  const cookieStore = await cookies();
  const hasSession = !!cookieStore.get("session_token")?.value;

  return (
    <div className="min-h-screen">
      {/* Article Header */}
      <section className="relative py-12 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-gray-950 to-gray-950" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-10 transition-colors group"
          >
            <svg
              className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Torna alla home
          </Link>

          {isDraft && (
            <div className="mb-6 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm font-medium">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15H9v-2.828z" />
              </svg>
              Bozza — non ancora pubblicata, visibile solo a te
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2.5 mb-5">
            <span
              className={`${getCategoryColor(article.category)} text-white text-xs font-semibold px-3 py-1 rounded-full`}
            >
              {getCategoryEmoji(article.category)} {article.category}
            </span>
            <span className="text-gray-500 text-sm">
              {formatDate(article.createdAt)}
            </span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-500 text-sm">
              {article.readingTime} min di lettura
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-6 leading-[1.15] tracking-tight">
            {article.title}
          </h1>

          <p className="text-lg md:text-xl text-gray-400 leading-relaxed mb-8">
            {article.summary}
          </p>

          <div className="flex flex-wrap gap-2">
            {parseTags(article.tags).map((tag) => (
              <span
                key={tag}
                className="text-xs text-gray-500 bg-gray-800/80 px-2.5 py-1 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {article.externalUrl ? (
          <div className="bg-gray-900/30 rounded-2xl border border-gray-800/60 p-5 sm:p-8 md:p-12">
            <p className="text-gray-300 text-base leading-relaxed mb-8">{article.summary}</p>
            <a
              href={article.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl transition-colors"
            >
              Leggi l&apos;articolo completo →
            </a>
            <p className="text-xs text-gray-600 mt-4">
              Questo contenuto è ospitato su un sito esterno. Il link ti porterà alla fonte originale.
            </p>
          </div>
        ) : (
          <div className="bg-gray-900/30 rounded-2xl border border-gray-800/60 p-5 sm:p-8 md:p-12 overflow-hidden">
            <div
              className="prose-custom min-w-0"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
            />
          </div>
        )}

        {/* AI Disclaimer — only for AI-generated articles without external URL */}
        {!article.externalUrl && !article.authorId && (
        <div className="mt-8 p-4 rounded-xl bg-gray-800/50 border border-gray-700/50 text-sm text-gray-400 flex items-start gap-3">
          <span className="text-lg leading-none mt-0.5">ℹ️</span>
          <div>
            <span className="font-medium text-gray-300">Nota sulla generazione AI:</span>{" "}
            Questo articolo è stato generato con intelligenza artificiale a partire da fonti pubbliche.
            Le informazioni sono verificate per accuratezza ma consigliamo sempre di consultare le fonti originali.
          </div>
        </div>
        )}

        {/* Vote + Share + Edit */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <VoteButton articleId={article.id} />
          <ShareButtons
            url={`https://blog.bitora.it/articolo/${article.slug}`}
            title={article.title}
            summary={article.summary}
          />
          {hasSession && (
            <Link
              href={`/articolo/${article.slug}/edit`}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 hover:text-white text-sm font-medium rounded-xl border border-gray-700/50 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Modifica
            </Link>
          )}
        </div>

        {/* Bitora Promo (for promoted articles) */}
        {article.promoted && (
          <div className="mt-6 p-6 rounded-xl bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border border-blue-500/20">
            <div className="flex items-center gap-3 mb-3">
              <Image
                src="https://bitora.it/bitora.png"
                alt="Bitora"
                width={36}
                height={36}
                className="rounded-lg"
                unoptimized
              />
              <div>
                <span className="text-white font-semibold text-sm block">Bitora.it</span>
                <span className="text-gray-400 text-xs">Sviluppo software &amp; consulenza IT</span>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              Cerchi un partner tecnologico per il tuo progetto? Bitora è un&apos;azienda 
              italiana specializzata in sviluppo software su misura, architetture cloud, 
              automazione e consulenza IT per aziende e startup.
            </p>
            <a
              href="https://bitora.it"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 text-sm font-medium rounded-lg border border-blue-500/20 transition-all"
            >
              Scopri i servizi di Bitora →
            </a>
          </div>
        )}
      </section>

      {/* Comments Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-gray-900/30 rounded-2xl border border-gray-800/60 p-5 sm:p-6 md:p-8">
          <CommentSection articleId={article.id} />
        </div>
      </section>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <h2 className="text-2xl font-bold text-white mb-6">
            Articoli correlati
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {relatedArticles.map((related) => (
              <Link
                key={related.slug}
                href={`/articolo/${related.slug}`}
                className="group block"
              >
                <article className="h-full rounded-xl bg-gray-900 border border-gray-800 hover:border-blue-500/50 transition-all p-6">
                  <span
                    className={`${getCategoryColor(related.category)} text-white text-xs font-semibold px-2.5 py-0.5 rounded-full`}
                  >
                    {related.category}
                  </span>
                  <h3 className="text-lg font-semibold text-white mt-3 mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                    {related.title}
                  </h3>
                  <p className="text-gray-400 text-sm line-clamp-2">
                    {related.summary}
                  </p>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
