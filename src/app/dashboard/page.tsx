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

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
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
                    {article.isDraft && (
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
                <Link
                  href={`/articolo/${article.slug}/edit`}
                  className="text-xs text-gray-500 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Modifica
                </Link>
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
      {!isCreator && !isAdmin && (
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
    </div>
  );
}
