import { Suspense } from "react";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import SearchBar from "@/components/SearchBar";
import ArticleCard from "@/components/ArticleCard";
import CategoryFilter from "@/components/CategoryFilter";

interface HomeProps {
  searchParams: Promise<{ category?: string; page?: string }>;
}

async function getArticles(category?: string, page: number = 1) {
  const limit = 12;
  const where = {
    published: true,
    ...(category ? { category } : {}),
  };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.article.count({ where }),
  ]);

  return { articles, total, pages: Math.ceil(total / limit) };
}

async function getTopVoted() {
  return prisma.article.findMany({
    where: { published: true, upvotes: { gt: 0 } },
    orderBy: { upvotes: "desc" },
    take: 3,
  });
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const category = params.category;
  const page = parseInt(params.page || "1");
  const { articles, pages } = await getArticles(category, page);
  const topVoted = !category && page === 1 ? await getTopVoted() : [];

  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="min-h-screen">
      {/* Hero Section — deep space */}
      <section className="relative py-16 sm:py-24 md:py-32 overflow-hidden">
        {/* Starfield */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(60)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-star"
              style={{
                width: i % 5 === 0 ? 2 : 1,
                height: i % 5 === 0 ? 2 : 1,
                background: i % 3 === 0 ? "#818cf8" : i % 3 === 1 ? "#38bdf8" : "#ffffff",
                left: `${(i * 73 + 11) % 100}%`,
                top: `${(i * 47 + 23) % 100}%`,
                animationDelay: `${(i * 0.3) % 4}s`,
                animationDuration: `${2 + (i % 3)}s`,
                opacity: 0.3 + (i % 4) * 0.15,
              }}
            />
          ))}
        </div>
        {/* Nebula blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute animate-nebula"
            style={{
              top: "-20%", left: "10%",
              width: 600, height: 600,
              background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
          <div
            className="absolute animate-nebula"
            style={{
              top: "30%", right: "-5%",
              width: 500, height: 500,
              background: "radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 70%)",
              filter: "blur(60px)",
              animationDelay: "4s",
            }}
          />
          <div
            className="absolute animate-nebula"
            style={{
              bottom: "-10%", left: "40%",
              width: 400, height: 400,
              background: "radial-gradient(circle, rgba(192,132,252,0.1) 0%, transparent 70%)",
              filter: "blur(60px)",
              animationDelay: "8s",
            }}
          />
        </div>
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/80 via-gray-950 to-gray-950" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-medium tracking-wide uppercase mb-8"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(56,189,248,0.05))",
              borderColor: "rgba(99,102,241,0.3)",
              color: "#a5b4fc",
            }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-400" />
            </span>
            Powered by AI · Fonti verificate
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.1]">
            Notizie{" "}
            <span className="text-shimmer">
              generate dall&apos;AI
            </span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            Cerca qualsiasi argomento e l&apos;intelligenza artificiale scriverà articoli approfonditi con fonti autorevoli, in tempo reale.
          </p>
          <SearchBar />
        </div>
      </section>

      {/* Articles Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="mb-8">
          <Suspense fallback={null}>
            <CategoryFilter />
          </Suspense>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Nessun articolo trovato
            </h2>
            <p className="text-gray-400 mb-6">
              {category
                ? `Non ci sono ancora articoli nella categoria "${category}".`
                : "Il blog è ancora vuoto. Usa la barra di ricerca per generare il primo articolo!"}
            </p>
            <p className="text-gray-500 text-sm">
              Prova a cercare un argomento nella barra di ricerca sopra
            </p>
          </div>
        ) : (
          <>
            {/* Featured Article */}
            {featured && !category && page === 1 && (
              <div className="mb-8">
                <ArticleCard article={featured} featured />
              </div>
            )}

            {/* Top Voted */}
            {topVoted.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-5">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <h2 className="text-xl font-bold text-white">Più votati dalla community</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {topVoted.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </div>
            )}

            {/* Article Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {(category || page > 1 ? articles : rest).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {/* Pagination — modern */}
            {pages > 1 && (() => {
              const delta = 2;
              const range: number[] = [];
              for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) {
                range.push(i);
              }
              const showFirst = range[0] > 1;
              const showLast = range[range.length - 1] < pages;
              const catStr = category ? `&category=${encodeURIComponent(category)}` : "";
              return (
                <nav className="flex items-center justify-center gap-1.5 mt-14" aria-label="Paginazione">
                  {/* Prev */}
                  <a
                    href={page > 1 ? `/?page=${page - 1}${catStr}` : undefined}
                    aria-disabled={page === 1}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      page === 1
                        ? "text-gray-700 cursor-not-allowed pointer-events-none"
                        : "text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800 hover:border-gray-700"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Precedente
                  </a>

                  {/* First + ellipsis */}
                  {showFirst && (
                    <>
                      <a href={`/?page=1${catStr}`} className="px-3.5 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800 hover:border-gray-700 transition-all">1</a>
                      {range[0] > 2 && <span className="px-1 text-gray-700">···</span>}
                    </>
                  )}

                  {/* Page numbers */}
                  {range.map((p) => (
                    <a
                      key={p}
                      href={`/?page=${p}${catStr}`}
                      className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                        p === page
                          ? "text-white border border-indigo-500/50"
                          : "text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800 hover:border-gray-700"
                      }`}
                      style={p === page ? {
                        background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(56,189,248,0.1))",
                        boxShadow: "0 0 12px rgba(99,102,241,0.3)",
                      } : {}}
                    >
                      {p}
                    </a>
                  ))}

                  {/* Last + ellipsis */}
                  {showLast && (
                    <>
                      {range[range.length - 1] < pages - 1 && <span className="px-1 text-gray-700">···</span>}
                      <a href={`/?page=${pages}${catStr}`} className="px-3.5 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800 hover:border-gray-700 transition-all">{pages}</a>
                    </>
                  )}

                  {/* Next */}
                  <a
                    href={page < pages ? `/?page=${page + 1}${catStr}` : undefined}
                    aria-disabled={page === pages}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      page === pages
                        ? "text-gray-700 cursor-not-allowed pointer-events-none"
                        : "text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800 hover:border-gray-700"
                    }`}
                  >
                    Successiva
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </nav>
              );
            })()}
          </>
        )}
      </section>

      {/* Bitora CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative overflow-hidden rounded-2xl p-px"
          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.7), rgba(56,189,248,0.5), rgba(192,132,252,0.5))" }}
        >
          <div className="relative rounded-2xl bg-gray-950/90 backdrop-blur-sm p-8 md:p-12">
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl" />
            </div>
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Image
                    src="https://bitora.it/bitora.png"
                    alt="Bitora"
                    width={24}
                    height={24}
                    className="rounded-md"
                    unoptimized
                  />
                  <span className="text-indigo-300 text-sm font-medium">bitora.it</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Hai bisogno di soluzioni tech su misura?
                </h2>
                <p className="text-blue-100/70 text-base leading-relaxed">
                  Bitora è un&apos;azienda italiana specializzata in sviluppo software,
                  consulenza IT, soluzioni cloud e automazione digitale.
                  Dalla progettazione al deployment, trasformiamo le tue idee in prodotti digitali.
                </p>
              </div>
              <a
                href="https://bitora.it"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3.5 bg-white text-gray-900 font-semibold rounded-xl hover:bg-blue-50 transition-colors whitespace-nowrap shadow-lg shadow-black/20"
              >
                Scopri bitora.it →
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
