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
      <section className="relative py-20 sm:py-28 md:py-40 overflow-hidden">

        {/* Dense starfield — 150 stars */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(150)].map((_, i) => {
            const size = i % 20 === 0 ? 3 : i % 7 === 0 ? 2 : i % 3 === 0 ? 1.5 : 1;
            const color = i % 5 === 0 ? "#c084fc" : i % 4 === 0 ? "#38bdf8" : i % 3 === 0 ? "#818cf8" : i % 7 === 0 ? "#f0abfc" : "#ffffff";
            return (
              <div
                key={i}
                className="absolute rounded-full animate-star"
                style={{
                  width: size,
                  height: size,
                  background: color,
                  boxShadow: size >= 2 ? `0 0 ${size * 3}px ${color}` : undefined,
                  left: `${(i * 67 + 13) % 100}%`,
                  top: `${(i * 41 + 7) % 100}%`,
                  animationDelay: `${(i * 0.19) % 5}s`,
                  animationDuration: `${1.8 + (i % 5) * 0.6}s`,
                }}
              />
            );
          })}
        </div>

        {/* Shooting stars */}
        {[
          { top: "8%",  left: "75%", delay: "0s",   dur: "2.2s" },
          { top: "22%", left: "55%", delay: "4s",   dur: "2.6s" },
          { top: "5%",  left: "35%", delay: "8.5s", dur: "2s"   },
          { top: "40%", left: "82%", delay: "13s",  dur: "2.4s" },
        ].map((s, i) => (
          <div
            key={i}
            className="absolute pointer-events-none"
            style={{ top: s.top, left: s.left, animationDelay: s.delay }}
          >
            <div
              className="animate-shoot"
              style={{
                height: "1.5px",
                width: 140,
                animationDuration: s.dur,
                animationDelay: s.delay,
                animationIterationCount: "infinite",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), rgba(196,181,253,0.6), transparent)",
                borderRadius: 2,
              }}
            />
          </div>
        ))}

        {/* Nebula blobs — stronger opacity */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute animate-nebula" style={{ top: "-15%", left: "5%",   width: 700, height: 700, background: "radial-gradient(circle, rgba(99,102,241,0.28) 0%, transparent 65%)",  filter: "blur(70px)" }} />
          <div className="absolute animate-nebula" style={{ top: "20%",  right: "-8%", width: 600, height: 600, background: "radial-gradient(circle, rgba(56,189,248,0.20) 0%, transparent 65%)",  filter: "blur(65px)", animationDelay: "5s" }} />
          <div className="absolute animate-nebula" style={{ bottom: "-5%",left: "35%", width: 550, height: 550, background: "radial-gradient(circle, rgba(192,132,252,0.22) 0%, transparent 65%)", filter: "blur(65px)", animationDelay: "10s" }} />
          <div className="absolute animate-nebula" style={{ top: "50%",  left: "20%", width: 350, height: 350, background: "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 65%)",  filter: "blur(50px)", animationDelay: "2s" }} />
        </div>

        {/* Subtle vignette so text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#03050e]/30 to-[#03050e]/70 pointer-events-none" />
        {/* Bottom horizon glow */}
        <div className="absolute bottom-0 inset-x-0 h-32 hero-horizon pointer-events-none" />

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
            Powered by AI · Aggiornato ogni giorno
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.1]">
            Il blog che si{" "}
            <span className="text-shimmer">
              adatta a te
            </span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            Cerca qualsiasi argomento ti incuriosisce e l&apos;intelligenza artificiale scriverà articoli approfonditi per te, con fonti affidabili, in tempo reale.
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
              Prova a cercare qualsiasi argomento ti incuriosisce
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
                  <span className="text-indigo-300 text-sm font-medium">Bitora.it</span>
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
                Scopri Bitora.it →
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
