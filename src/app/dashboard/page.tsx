"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  onboardingComplete: boolean;
  preferredCategories: string | null;
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
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Welcome */}
      <div className="mb-8">
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

      {/* Admin panel */}
      {isAdmin && adminUsers.length > 0 && (
        <div className="mb-8">
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
    </div>
  );
}
