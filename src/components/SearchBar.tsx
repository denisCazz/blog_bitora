"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDate, getCategoryColor, getCategoryEmoji } from "@/lib/utils";
import { parseTags } from "@/lib/tags";

interface SearchArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags: string | string[];
  readingTime: number;
  promoted: boolean;
  createdAt: string;
}

const LOADING_STEPS = [
  "Analisi dell'argomento...",
  "Ricerca fonti autorevoli...",
  "Generazione articoli da angolazioni diverse...",
  "Scrittura e formattazione...",
  "Verifica fonti e finalizzazione...",
];

type SearchMode = "basic" | "ai";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [articles, setArticles] = useState<SearchArticle[]>([]);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [aiRemaining, setAiRemaining] = useState<number | null>(null);
  const [aiLimit, setAiLimit] = useState<number | null>(null);
  const [searchMode, setSearchMode] = useState<SearchMode>("basic");

  useEffect(() => {
    fetch("/api/auth")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setIsLoggedIn(true);
          setSearchMode("ai"); // default to AI for logged-in users
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingStep((s) => (s + 1) % LOADING_STEPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [loading]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setLoadingStep(0);
    setArticles([]);
    setError("");

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          type: searchMode === "basic" ? "basic" : undefined,
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setError(data.error || "Limite giornaliero raggiunto");
        setAiRemaining(0);
        return;
      }

      if (data.remaining !== undefined) {
        setAiRemaining(data.remaining);
      }
      if (data.articles && data.articles.length > 0) {
        setArticles(data.articles);
      } else if (data.error) {
        setError(data.error);
      } else {
        setError("Nessun risultato trovato");
      }
    } catch {
      setError("Errore di connessione. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  const isAiDisabled = isLoggedIn && aiRemaining === 0;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Mode toggle */}
      {isLoggedIn && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setSearchMode("basic")}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              searchMode === "basic"
                ? "bg-gray-800 border-gray-700 text-white"
                : "border-gray-800 text-gray-500 hover:text-gray-300"
            }`}
          >
            Cerca negli articoli
          </button>
          <button
            type="button"
            onClick={() => !isAiDisabled && setSearchMode("ai")}
            disabled={isAiDisabled}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              searchMode === "ai"
                ? "bg-blue-500/10 border-blue-500/40 text-blue-400"
                : isAiDisabled
                ? "border-gray-800 text-gray-600 cursor-not-allowed"
                : "border-gray-800 text-gray-500 hover:text-gray-300"
            }`}
          >
            Genera con AI
            {aiRemaining !== null && (
              <span className="ml-1.5 text-[10px] opacity-70">
                ({aiRemaining} rimast{aiRemaining === 1 ? "o" : "i"})
              </span>
            )}
          </button>
        </div>
      )}
      <form onSubmit={handleSearch}>
        <div className="relative group">
          <div
            className={`absolute -inset-0.5 rounded-2xl blur-sm transition duration-500 ${
              loading
                ? "opacity-100 bg-gradient-to-r from-sky-400/60 via-indigo-500/60 to-violet-500/60 animate-pulse"
                : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 bg-gradient-to-r from-blue-500/60 to-indigo-500/60"
            }`}
          />
          <div className="relative flex items-center bg-gray-900 rounded-xl border border-gray-800 group-focus-within:border-gray-700 overflow-hidden transition-colors">
            <div className="pl-5 text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca un argomento tech..."
              className="flex-1 bg-transparent text-white placeholder-gray-600 px-4 py-4 text-base focus:outline-none"
              disabled={loading}
              maxLength={200}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-4 bg-blue-500 text-white text-sm font-semibold hover:bg-blue-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {searchMode === "ai" ? "Generazione..." : "Ricerca..."}
                </div>
              ) : searchMode === "ai" && isLoggedIn ? (
                "Genera articoli"
              ) : (
                "Cerca"
              )}
            </button>
          </div>
        </div>
      </form>

      {!loading && !articles.length && !error && (
        <p className="text-center text-gray-600 text-xs mt-3">
          {searchMode === "ai" && isLoggedIn
            ? "L'AI genererà 3 articoli da angolazioni diverse · Es: intelligenza artificiale, cybersecurity, Web3"
            : "Cerca tra gli articoli esistenti · Accedi per generare articoli con l'AI"}
        </p>
      )}

      {/* Loading — cosmic AI animation */}
      {loading && (
        <div className="mt-10 flex flex-col items-center gap-8">
          {/* Cosmic orb */}
          <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
            {/* Outer glow */}
            <div
              className="absolute inset-0 rounded-full animate-ai-glow"
              style={{ background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)" }}
            />
            {/* Ring 1 */}
            <div
              className="absolute animate-ring"
              style={{
                width: 120, height: 120,
                borderRadius: "50%",
                border: "1.5px solid transparent",
                backgroundImage: "linear-gradient(135deg, #38bdf8, #818cf8, transparent, transparent)",
                backgroundOrigin: "border-box",
                WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "destination-out",
                maskComposite: "exclude",
              }}
            />
            {/* Ring 2 */}
            <div
              className="absolute animate-ring-rev"
              style={{
                width: 100, height: 100,
                borderRadius: "50%",
                border: "1.5px solid transparent",
                backgroundImage: "linear-gradient(45deg, #c084fc, #38bdf8, transparent, transparent)",
                backgroundOrigin: "border-box",
                WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "destination-out",
                maskComposite: "exclude",
              }}
            />
            {/* Orbiting particles */}
            {[
              { delay: "0s", r: 52, color: "#38bdf8", size: 6 },
              { delay: "1.2s", r: 52, color: "#c084fc", size: 5 },
              { delay: "2.4s", r: 52, color: "#818cf8", size: 4 },
            ].map((p, i) => (
              <div
                key={i}
                className="absolute animate-orbit"
                style={{
                  width: p.size, height: p.size,
                  borderRadius: "50%",
                  background: p.color,
                  boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                  animationDelay: p.delay,
                  "--orbit-r": `${p.r}px`,
                } as React.CSSProperties}
              />
            ))}
            {/* Core */}
            <div
              className="relative z-10 rounded-full animate-ai-glow"
              style={{
                width: 56, height: 56,
                background: "radial-gradient(circle at 35% 35%, #818cf8, #38bdf8 50%, #4f46e5)",
                boxShadow: "0 0 24px rgba(129,140,248,0.7), 0 0 48px rgba(56,189,248,0.3)",
              }}
            >
              {/* Inner sparkle */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
                    fill="white" fillOpacity="0.9"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Step text */}
          <div className="text-center space-y-2">
            <p className="text-shimmer text-sm font-semibold tracking-wide">
              {LOADING_STEPS[loadingStep]}
            </p>
            <p className="text-gray-600 text-xs">
              Passo {loadingStep + 1} di {LOADING_STEPS.length}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex gap-2">
            {LOADING_STEPS.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-700"
                style={{
                  width: i === loadingStep ? 28 : 8,
                  background: i < loadingStep
                    ? "linear-gradient(90deg,#38bdf8,#818cf8)"
                    : i === loadingStep
                    ? "linear-gradient(90deg,#818cf8,#c084fc)"
                    : "#374151",
                  boxShadow: i === loadingStep ? "0 0 8px rgba(129,140,248,0.7)" : "none",
                }}
              />
            ))}
          </div>

          {/* Cosmic skeleton cards */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-xl border p-5 animate-pulse"
                style={{
                  background: "linear-gradient(135deg, rgba(99,102,241,0.05), rgba(56,189,248,0.03))",
                  borderColor: `rgba(${i === 0 ? "56,189,248" : i === 1 ? "129,140,248" : "192,132,252"},0.15)`,
                  animationDelay: `${i * 250}ms`,
                }}
              >
                <div className="h-2.5 w-16 rounded-full mb-4" style={{ background: "rgba(99,102,241,0.2)" }} />
                <div className="h-3.5 w-full rounded mb-2" style={{ background: "rgba(129,140,248,0.1)" }} />
                <div className="h-3.5 w-3/4 rounded mb-4" style={{ background: "rgba(129,140,248,0.1)" }} />
                <div className="h-2.5 w-full rounded mb-1.5" style={{ background: "rgba(99,102,241,0.07)" }} />
                <div className="h-2.5 w-2/3 rounded" style={{ background: "rgba(99,102,241,0.07)" }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* Results */}
      {articles.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-lg">
              <span className="text-shimmer">{articles.length}</span>{" "}
              articol{articles.length === 1 ? "o" : "i"} generat{articles.length === 1 ? "o" : "i"}
            </h3>
            <button
              onClick={() => setArticles([])}
              className="text-gray-500 hover:text-white text-sm transition-colors"
            >
              Chiudi
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((article, i) => (
              <Link
                key={article.id}
                href={`/articolo/${article.slug}`}
                className="group block rounded-xl border p-5 transition-all duration-300"
                style={{
                  background: "linear-gradient(135deg, rgba(15,15,30,0.9), rgba(20,20,40,0.9))",
                  borderColor: "rgba(99,102,241,0.2)",
                  boxShadow: "0 0 0 0 rgba(99,102,241,0)",
                  animationDelay: `${i * 150}ms`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(129,140,248,0.5)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(99,102,241,0.15)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.2)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 0 rgba(99,102,241,0)";
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`${getCategoryColor(article.category)} text-white text-[10px] font-semibold px-2 py-0.5 rounded-full`}
                  >
                    {getCategoryEmoji(article.category)} {article.category}
                  </span>
                </div>
                <h4 className="text-white font-semibold text-sm mb-2 group-hover:text-indigo-300 transition-colors line-clamp-2">
                  {article.title}
                </h4>
                <p className="text-gray-400 text-xs line-clamp-3 mb-3">
                  {article.summary}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-800/60">
                  <div className="flex gap-1.5">
                    {parseTags(article.tags).slice(0, 2).map((tag) => (
                      <span key={tag} className="text-[10px] text-indigo-400/60 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-gray-600 text-[10px]">{article.readingTime} min</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
