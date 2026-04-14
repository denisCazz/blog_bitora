"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/utils";

type Phase = "topic" | "editor";

export default function CreaPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("topic");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);

  // Article fields
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PROFILE_ONLY">(
    "PUBLIC"
  );

  // Auth check
  useEffect(() => {
    fetch("/api/auth")
      .then((res) => {
        if (!res.ok) {
          router.push("/login");
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data && !["CREATOR", "ADMIN"].includes(data.user?.role)) {
          router.push("/dashboard");
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/creator/articles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Errore nella generazione");
        return;
      }

      setTitle(data.article.title || "");
      setSummary(data.article.summary || "");
      setContent(data.article.content || "");
      setCategory(data.article.category || CATEGORIES[0]);
      setTags(
        Array.isArray(data.article.tags)
          ? data.article.tags.join(", ")
          : data.article.tags || ""
      );
      setPhase("editor");
    } catch {
      setError("Errore di connessione");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (isDraft: boolean) => {
    if (!title.trim() || !content.trim() || loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/creator/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          summary: summary.trim(),
          content,
          category,
          tags,
          visibility,
          isDraft,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Errore nel salvataggio");
        return;
      }

      router.push(isDraft ? "/dashboard" : `/articolo/${data.article.slug}`);
    } catch {
      setError("Errore di connessione");
    } finally {
      setLoading(false);
    }
  };

  // Topic phase
  if (phase === "topic") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Crea un nuovo articolo
          </h1>
          <p className="text-gray-500 text-sm">
            Inserisci un argomento e l&apos;AI genererà una bozza che potrai modificare
          </p>
        </div>

        <form
          onSubmit={handleGenerate}
          className="bg-gray-900/50 rounded-2xl border border-gray-800/60 p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Argomento
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Es: I nuovi modelli AI di Google nel 2026"
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="w-full px-4 py-3 bg-purple-500 text-white text-sm font-semibold rounded-lg hover:bg-purple-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generazione in corso...
              </span>
            ) : (
              "Genera bozza con AI"
            )}
          </button>
        </form>
      </div>
    );
  }

  // Editor phase
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Modifica articolo</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(!preview)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              preview
                ? "bg-blue-500/10 border-blue-500/40 text-blue-400"
                : "bg-gray-900/50 border-gray-800/60 text-gray-400 hover:text-white"
            }`}
          >
            {preview ? "Editor" : "Preview"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {preview ? (
        <div className="bg-gray-900/50 rounded-2xl border border-gray-800/60 p-8">
          <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
          <p className="text-gray-400 mb-6">{summary}</p>
          <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap">
            {content}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Titolo
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Sommario
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Contenuto
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500/50 transition-colors resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Visibilità
              </label>
              <select
                value={visibility}
                onChange={(e) =>
                  setVisibility(e.target.value as "PUBLIC" | "PROFILE_ONLY")
                }
                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
              >
                <option value="PUBLIC">Pubblico</option>
                <option value="PROFILE_ONLY">Solo profilo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Tags (separati da virgola)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={() => handleSave(false)}
              disabled={loading || !title.trim() || !content.trim()}
              className="px-6 py-2.5 bg-purple-500 text-white text-sm font-semibold rounded-lg hover:bg-purple-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Salvataggio..." : "Pubblica"}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={loading || !title.trim()}
              className="px-6 py-2.5 bg-gray-800 text-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Salva bozza
            </button>
            <button
              onClick={() => setPhase("topic")}
              className="px-4 py-2.5 text-gray-500 text-sm hover:text-white transition-colors"
            >
              Rigenera
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
