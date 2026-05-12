"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/utils";

interface ArticleData {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  tags: string;
}

export default function EditArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tagsStr, setTagsStr] = useState("");

  useEffect(() => {
    params.then(({ slug }) => {
      fetch(`/api/articles?slug=${encodeURIComponent(slug)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.article) {
            const a = data.article;
            setArticle(a);
            setTitle(a.title);
            setSummary(a.summary);
            setContent(a.content);
            setCategory(a.category);
            const tags = (() => {
              try {
                const parsed = JSON.parse(a.tags);
                return Array.isArray(parsed) ? parsed.join(", ") : a.tags;
              } catch {
                return a.tags;
              }
            })();
            setTagsStr(tags);
          } else {
            setError("Articolo non trovato");
          }
        })
        .catch(() => setError("Errore nel caricamento"))
        .finally(() => setLoading(false));
    });
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article || saving) return;

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const tagsArray = tagsStr
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch(`/api/articles/${article.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          content,
          category,
          tags: JSON.stringify(tagsArray),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Errore durante il salvataggio");
        return;
      }

      const data = await res.json();
      setSuccess(true);
      setTimeout(() => {
        if (data.article.isDraft || !data.article.published) {
          router.push("/dashboard");
        } else {
          router.push(`/articolo/${data.article.slug}`);
        }
        router.refresh();
      }, 1000);
    } catch {
      setError("Errore di connessione");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-gray-400">Caricamento...</div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-red-400">{error || "Articolo non trovato"}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Modifica articolo</h1>
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          ← Torna indietro
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-gray-900/30 rounded-2xl border border-gray-800/60 p-5 sm:p-8 space-y-6"
      >
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1.5">
            Titolo
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
            maxLength={500}
          />
        </div>

        {/* Summary */}
        <div>
          <label htmlFor="summary" className="block text-sm font-medium text-gray-300 mb-1.5">
            Riassunto
          </label>
          <textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors resize-none"
            maxLength={2000}
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1.5">
            Categoria
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gray-600 transition-colors"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-1.5">
            Tags (separati da virgola)
          </label>
          <input
            id="tags"
            type="text"
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            placeholder="tag1, tag2, tag3"
            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
          />
        </div>

        {/* Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-1.5">
            Contenuto (Markdown)
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors resize-y font-mono"
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
            Articolo salvato! Reindirizzamento...
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim() || !content.trim()}
            className="px-6 py-2.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Salvataggio..." : "Salva modifiche"}
          </button>
        </div>
      </form>
    </div>
  );
}
