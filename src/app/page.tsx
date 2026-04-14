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
      {/* Hero Section */}
      <section className="relative py-12 sm:py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-gray-950 to-gray-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium tracking-wide uppercase mb-8">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-400"></span>
            </span>
            Powered by AI · Fonti verificate
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
            Notizie tech,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              generate dall&apos;AI
            </span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            Cerca qualsiasi argomento tech e l&apos;intelligenza artificiale
            scriverà un articolo approfondito con fonti autorevoli, in tempo reale.
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
              Prova a cercare un argomento tech nella barra di ricerca sopra
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(category || page > 1 ? articles : rest).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <a
                    key={p}
                    href={`/?page=${p}${category ? `&category=${encodeURIComponent(category)}` : ""}`}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      p === page
                        ? "bg-blue-500 text-white"
                        : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                    }`}
                  >
                    {p}
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Bitora CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-px">
          <div className="relative rounded-2xl bg-gray-950/40 backdrop-blur-sm p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
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
                  <span className="text-blue-300 text-sm font-medium">bitora.it</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Hai bisogno di soluzioni tech su misura?
                </h2>
                <p className="text-blue-100/80 text-base leading-relaxed">
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
