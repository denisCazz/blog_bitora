"use client";

import { useState, useEffect } from "react";

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

interface CommentSectionProps {
  articleId: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "adesso";
  if (mins < 60) return `${mins} min fa`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h fa`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}g fa`;
  return new Date(dateStr).toLocaleDateString("it-IT");
}

export default function CommentSection({ articleId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/articles/${articleId}/comments`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setComments(data);
      })
      .catch(() => {});
  }, [articleId]);

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !content.trim() || loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/articles/${articleId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: author.trim(),
          content: content.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Errore nel salvataggio");
        return;
      }

      const comment = await res.json();
      setComments((prev) => [comment, ...prev]);
      setContent("");
    } catch {
      setError("Errore di connessione");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        Commenti
        {comments.length > 0 && (
          <span className="text-xs font-normal text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
            {comments.length}
          </span>
        )}
      </h3>

      {/* Comment form */}
      <form onSubmit={submitComment} className="space-y-3">
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Il tuo nome"
          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
          maxLength={100}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Scrivi un commento..."
          rows={3}
          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors resize-none"
          maxLength={2000}
        />
        {error && (
          <p className="text-red-400 text-xs">{error}</p>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !author.trim() || !content.trim()}
            className="px-5 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Invio..." : "Commenta"}
          </button>
        </div>
      </form>

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-6">
          Nessun commento ancora. Sii il primo!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 rounded-xl bg-gray-800/30 border border-gray-800/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {comment.author.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-white text-sm font-medium">
                  {comment.author}
                </span>
                <span className="text-gray-600 text-xs">
                  {timeAgo(comment.createdAt)}
                </span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed pl-9">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
