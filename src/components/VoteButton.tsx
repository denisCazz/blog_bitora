"use client";

import { useState, useEffect } from "react";

interface VoteButtonProps {
  articleId: string;
}

export default function VoteButton({ articleId }: VoteButtonProps) {
  const [upvotes, setUpvotes] = useState(0);
  const [userVote, setUserVote] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/articles/${articleId}/vote`)
      .then((r) => r.json())
      .then((data) => {
        setUpvotes(data.upvotes ?? 0);
        setUserVote(data.userVote ?? 0);
      })
      .catch(() => {});
  }, [articleId]);

  const vote = async (value: number) => {
    if (loading) return;
    setLoading(true);

    // If clicking same vote, remove it
    const newValue = userVote === value ? 0 : value;

    try {
      const res = await fetch(`/api/articles/${articleId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: newValue }),
      });
      const data = await res.json();
      setUpvotes(data.upvotes ?? 0);
      setUserVote(data.userVote ?? 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1 bg-gray-800/80 rounded-xl border border-gray-700/50 p-1">
      <button
        onClick={() => vote(1)}
        disabled={loading}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          userVote === 1
            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
            : "text-gray-400 hover:text-white hover:bg-gray-700/50"
        }`}
        title="Upvote"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        </svg>
      </button>

      <span
        className={`text-sm font-bold min-w-[2rem] text-center tabular-nums ${
          upvotes > 0 ? "text-blue-400" : upvotes < 0 ? "text-red-400" : "text-gray-400"
        }`}
      >
        {upvotes}
      </span>

      <button
        onClick={() => vote(-1)}
        disabled={loading}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          userVote === -1
            ? "bg-red-500/20 text-red-400 border border-red-500/30"
            : "text-gray-400 hover:text-white hover:bg-gray-700/50"
        }`}
        title="Downvote"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
    </div>
  );
}
