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
            className={`absolute -inset-0.5 bg-gradient-to-r from-blue-500/60 to-indigo-500/60 rounded-2xl blur-sm transition duration-500 ${
              loading
                ? "opacity-100 animate-pulse"
                : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
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

      {/* Loading animation */}
      {loading && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-center gap-3 text-blue-400 text-sm font-medium">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
            </div>
            <span className="animate-pulse">{LOADING_STEPS[loadingStep]}</span>
          </div>

          {/* Skeleton cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-xl bg-gray-900/50 border border-gray-800/50 p-5 animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              >
                <div className="h-3 w-16 bg-gray-800 rounded-full mb-4" />
                <div className="h-4 w-full bg-gray-800 rounded mb-2" />
                <div className="h-4 w-3/4 bg-gray-800 rounded mb-4" />
                <div className="h-3 w-full bg-gray-800/50 rounded mb-1" />
                <div className="h-3 w-2/3 bg-gray-800/50 rounded" />
              </div>
            ))}
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 pt-2">
            {LOADING_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i <= loadingStep ? "w-6 bg-blue-500" : "w-1.5 bg-gray-700"
                }`}
              />
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
              {articles.length} articol{articles.length === 1 ? "o" : "i"} trovat{articles.length === 1 ? "o" : "i"}
            </h3>
            <button
              onClick={() => setArticles([])}
              className="text-gray-500 hover:text-white text-sm transition-colors"
            >
              Chiudi risultati
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((article, i) => (
              <Link
                key={article.id}
                href={`/articolo/${article.slug}`}
                className="group block rounded-xl bg-gray-900 border border-gray-800 hover:border-blue-500/50 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 animate-in"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`${getCategoryColor(article.category)} text-white text-[10px] font-semibold px-2 py-0.5 rounded-full`}
                  >
                    {getCategoryEmoji(article.category)} {article.category}
                  </span>
                </div>
                <h4 className="text-white font-semibold text-sm mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                  {article.title}
                </h4>
                <p className="text-gray-400 text-xs line-clamp-3 mb-3">
                  {article.summary}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                  <div className="flex gap-1.5">
                    {parseTags(article.tags).slice(0, 2).map((tag) => (
                      <span key={tag} className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
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
