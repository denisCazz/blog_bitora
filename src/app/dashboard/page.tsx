"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SpaceBackground from "@/components/SpaceBackground";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  onboardingComplete: boolean;
  preferredCategories: string | null;
  searchPreference: string | null;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  upvotes: number;
  published: boolean;
  isDraft: boolean;
  status: string;
  visibility: string;
  createdAt: string;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

interface LimitInfo {
  remaining: number;
  limit: number;
}

interface AIArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  upvotes: number;
  readingTime: number;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [aiArticles, setAiArticles] = useState<AIArticle[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [aiLimit, setAiLimit] = useState<LimitInfo | null>(null);
  const [creatorLimit, setCreatorLimit] = useState<LimitInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchPref, setSearchPref] = useState("");
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefSaved, setPrefSaved] = useState(false);

  // DB admin state
  const [dbHealth, setDbHealth] = useState<{ ok: boolean; latency?: number; error?: string } | null>(null);
  const [dbRunning, setDbRunning] = useState(false);
  const [dbLog, setDbLog] = useState("");
  const [dbLogError, setDbLogError] = useState("");

  const checkDbHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/db-health");
      const data = await res.json();
      setDbHealth(data);
    } catch {
      setDbHealth({ ok: false, error: "Non raggiungibile" });
    }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/auth");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        setUser(data.user);
        setSearchPref(data.user.searchPreference ?? "");

        if (!data.user.onboardingComplete) {
          router.push("/registrati");
          return;
        }

        // Load dashboard data
        const dashRes = await fetch("/api/dashboard");
        if (dashRes.ok) {
          const dashData = await dashRes.json();
          setArticles(dashData.articles || []);
          setAiArticles(dashData.aiArticles || []);
          setAiLimit(dashData.aiLimit || null);
          setCreatorLimit(dashData.creatorLimit || null);
        }

        // Load admin data if admin
        if (data.user.role === "ADMIN") {
          const adminRes = await fetch("/api/admin/users");
          if (adminRes.ok) {
            const adminData = await adminRes.json();
            setAdminUsers(adminData.users || []);
          }
          checkDbHealth();
        }
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loading || !user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="animate-pulse text-gray-500">Caricamento...</div>
      </div>
    );
  }

  const isCreator = user.role === "CREATOR";
  const isAdmin = user.role === "ADMIN";

  const savePreference = async () => {
    if (prefSaving) return;
    setPrefSaving(true);
    setPrefSaved(false);
    try {
      await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchPreference: searchPref }),
      });
      setPrefSaved(true);
      setTimeout(() => setPrefSaved(false), 3000);
    } finally {
      setPrefSaving(false);
    }
  };

  const runDbPush = async () => {
    if (dbRunning) return;
    setDbRunning(true);
    setDbLog("");
    setDbLogError("");
    try {
      const res = await fetch("/api/admin/db-push", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setDbLog(data.stdout || "✓ Schema sincronizzato con successo");
        checkDbHealth();
      } else {
        setDbLogError(data.stderr || data.error || "Errore sconosciuto");
      }
    } catch {
      setDbLogError("Errore di connessione");
    } finally {
      setDbRunning(false);
    }
  };

  const approveArticle = async (id: string, action: "approve" | "reject") => {
    const res = await fetch(`/api/admin/articles/${id}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      setArticles((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: action === "approve" ? "PUBLISHED" : "DRAFT",
                published: action === "approve",
                isDraft: action === "reject",
              }
            : a
        )
      );
    }
  };

  return (
    <div className="min-h-screen">
      {/* Space hero banner */}
      <div className="relative overflow-hidden py-10 mb-2">
        <SpaceBackground density="light" />
        <div className="relative max-w-5xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium mb-4"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(56,189,248,0.05))",
              borderColor: "rgba(99,102,241,0.3)",
              color: "#a5b4fc",
            }}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            Dashboard
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Ciao, {user.name}!
          </h1>
          <p className="text-gray-500 text-sm">
            {isCreator
              ? "Gestisci i tuoi articoli e crea nuovi contenuti"
              : isAdmin
              ? "Pannello amministrazione"
              : "Esplora e genera articoli personalizzati"}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-16">

      {/* Search Preferences */}
      <div className="mb-8">
        <div className="bg-gray-900/50 rounded-2xl border border-gray-800/60 p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(56,189,248,0.1))" }}>
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Personalizza la tua ricerca AI</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Scrivi in modo naturale chi sei e cosa ti interessa. L&apos;AI user&agrave; queste preferenze per adattare ogni articolo generato a te.
              </p>
            </div>
          </div>
          <textarea
            value={searchPref}
            onChange={(e) => setSearchPref(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Es: Sono un medico, mi interessano salute, ricerca scientifica e tecnologia medica. Preferisco articoli dettagliati con dati e studi."
            className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 resize-none transition-colors"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-600">{searchPref.length}/500 caratteri</span>
            <button
              onClick={savePreference}
              disabled={prefSaving}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                prefSaved
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20"
              } disabled:opacity-50`}
            >
              {prefSaving ? "Salvataggio..." : prefSaved ? "✓ Salvato" : "Salva preferenze"}
            </button>
          </div>
        </div>
      </div>

      {/* Usage cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {aiLimit && (
          <div className="bg-gray-900/50 rounded-2xl border border-gray-800/60 p-5">
            <div className="text-sm text-gray-400 mb-2">Articoli AI oggi</div>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-2xl font-bold text-white">
                {aiLimit.limit - aiLimit.remaining}
              </span>
              <span className="text-gray-500 text-sm mb-0.5">
                / {aiLimit.limit}
              </span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{
                  width: `${
                    ((aiLimit.limit - aiLimit.remaining) / aiLimit.limit) * 100
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        {isCreator && creatorLimit && (
          <div className="bg-gray-900/50 rounded-2xl border border-gray-800/60 p-5">
            <div className="text-sm text-gray-400 mb-2">
              Articoli pubblicati questo mese
            </div>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-2xl font-bold text-white">
                {creatorLimit.limit - creatorLimit.remaining}
              </span>
              <span className="text-gray-500 text-sm mb-0.5">
                / {creatorLimit.limit}
              </span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{
                  width: `${
                    ((creatorLimit.limit - creatorLimit.remaining) /
                      creatorLimit.limit) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="bg-gray-900/50 rounded-2xl border border-gray-800/60 p-5">
          <div className="text-sm text-gray-400 mb-2">Ruolo</div>
          <div className="text-lg font-semibold text-white capitalize">
            {user.role === "READER"
              ? "Lettore"
              : user.role === "CREATOR"
              ? "Creator"
              : user.role === "PLUS"
              ? "Plus"
              : "Admin"}
          </div>
          {user.role === "READER" && (
            <p className="text-xs text-gray-500 mt-1">
              Passa a Plus per più articoli AI al giorno
            </p>
          )}
        </div>
      </div>

      {/* Creator CTA */}
      {(isCreator || isAdmin) && (
        <div className="mb-8">
          <Link
            href="/crea"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-400 transition-colors"
          >
            <span className="text-lg">✍️</span>
            Crea nuovo articolo
          </Link>
        </div>
      )}

      {/* Articles list (Creator / Admin) */}
      {(isCreator || isAdmin) && articles.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            {isAdmin ? "Tutti gli articoli" : "I tuoi articoli"}
          </h2>
          <div className="space-y-2">
            {articles.map((article) => (
              <div
                key={article.id}
                className="flex items-center justify-between bg-gray-900/50 rounded-xl border border-gray-800/60 px-5 py-3"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <Link
                    href={`/articolo/${article.slug}`}
                    className="text-sm font-medium text-white hover:text-blue-400 truncate block"
                  >
                    {article.title}
                  </Link>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">
                      {article.category}
                    </span>
                    <span className="text-xs text-gray-600">
                      ↑ {article.upvotes}
                    </span>
                    {article.status === "PENDING_REVIEW" && (
                      <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        In revisione
                      </span>
                    )}
                    {article.status === "DRAFT" && (
                      <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">
                        Bozza
                      </span>
                    )}
                    {article.visibility === "PROFILE_ONLY" && (
                      <span className="text-xs text-gray-500 bg-gray-500/10 px-2 py-0.5 rounded">
                        Privato
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && article.status === "PENDING_REVIEW" && (
                    <>
                      <button
                        onClick={() => approveArticle(article.id, "approve")}
                        className="text-xs text-green-400 hover:text-green-300 px-3 py-1.5 rounded-lg hover:bg-green-500/10 transition-colors"
                      >
                        Approva
                      </button>
                      <button
                        onClick={() => approveArticle(article.id, "reject")}
                        className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        Rifiuta
                      </button>
                    </>
                  )}
                  <Link
                    href={`/articolo/${article.slug}/edit`}
                    className="text-xs text-gray-500 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Modifica
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin — Database panel */}
      {isAdmin && (
        <div className="mb-8">
          <div className="rounded-2xl border overflow-hidden"
            style={{
              borderColor: "rgba(99,102,241,0.2)",
              background: "linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(3,5,14,0.9) 100%)",
            }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
                  <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16M10 12h4" />
                  </svg>
                </div>
                <span className="text-white font-semibold text-sm">Database</span>
              </div>
              {/* Health badge */}
              {dbHealth ? (
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                  dbHealth.ok
                    ? "bg-green-500/10 border-green-500/20 text-green-400"
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dbHealth.ok ? "bg-green-400" : "bg-red-400"}`} />
                  {dbHealth.ok ? `Online · ${dbHealth.latency}ms` : "Offline"}
                </div>
              ) : (
                <button
                  onClick={checkDbHealth}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Verifica stato
                </button>
              )}
            </div>

            <div className="p-5 space-y-4">
              {/* Error info */}
              {dbHealth && !dbHealth.ok && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                  <p className="text-red-400 text-xs font-mono">{dbHealth.error}</p>
                </div>
              )}

              {/* Actions row */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={runDbPush}
                  disabled={dbRunning}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "rgba(99,102,241,0.1)",
                    borderColor: "rgba(99,102,241,0.25)",
                    color: "#a5b4fc",
                  }}
                >
                  {dbRunning ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sincronizzazione...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Sincronizza schema (db push)
                    </>
                  )}
                </button>

                <button
                  onClick={checkDbHealth}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-700/50 text-gray-400 hover:text-white hover:border-gray-600 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verifica stato
                </button>
              </div>

              {/* Log output */}
              {dbLog && (
                <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4">
                  <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap leading-relaxed">{dbLog}</pre>
                </div>
              )}
              {dbLogError && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                  <pre className="text-red-400 text-xs font-mono whitespace-pre-wrap leading-relaxed">{dbLogError}</pre>
                </div>
              )}

              <p className="text-gray-600 text-xs">
                Il comando <code className="text-indigo-400/70">prisma db push</code> aggiorna lo schema del database in base al file schema.prisma senza perdita di dati.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Admin panel */}
      {isAdmin && adminUsers.length > 0 && (        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            Utenti ({adminUsers.length})
          </h2>
          <div className="space-y-2">
            {adminUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between bg-gray-900/50 rounded-xl border border-gray-800/60 px-5 py-3"
              >
                <div>
                  <div className="text-sm text-white">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      u.role === "ADMIN"
                        ? "bg-orange-500/10 text-orange-400"
                        : u.role === "CREATOR"
                        ? "bg-purple-500/10 text-purple-400"
                        : u.role === "PLUS"
                        ? "bg-blue-500/10 text-blue-400"
                        : "bg-gray-500/10 text-gray-400"
                    }`}
                  >
                    {u.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reader view */}
      {!isCreator && !isAdmin && aiArticles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">
            Usa la barra di ricerca nella home per generare articoli personalizzati con l&apos;AI
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-400 transition-colors"
          >
            Vai alla Home
          </Link>
        </div>
      )}

      {/* AI-generated articles (all users) */}
      {aiArticles.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #818cf8, #38bdf8)" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">Le tue generazioni AI</h2>
            <span className="text-xs text-gray-600 ml-1">({aiArticles.length})</span>
          </div>
          <div className="space-y-2">
            {aiArticles.map((article) => (
              <Link
                key={article.id}
                href={`/articolo/${article.slug}`}
                className="flex items-center justify-between rounded-xl border px-5 py-3 transition-all group"
                style={{
                  background: "linear-gradient(135deg, rgba(99,102,241,0.05), rgba(56,189,248,0.03))",
                  borderColor: "rgba(99,102,241,0.15)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.35)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(99,102,241,0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.15)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <div className="flex-1 min-w-0 mr-4">
                  <span className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors truncate block">
                    {article.title}
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">{article.category}</span>
                    {article.upvotes > 0 && (
                      <span className="text-xs text-sky-500">↑ {article.upvotes}</span>
                    )}
                    <span className="text-xs text-gray-600">{article.readingTime} min</span>
                  </div>
                </div>
                <span className="text-xs text-indigo-400/70 shrink-0">Leggi →</span>
              </Link>
            ))}
          </div>
        </div>
      )}
      </div>{/* /max-w-5xl */}
    </div>
  );
}
