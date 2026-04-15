"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CATEGORIES, getCategoryColor, getCategoryEmoji } from "@/lib/utils";

export default function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category");
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/auth")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.preferredCategories) {
          try {
            const parsed = JSON.parse(data.user.preferredCategories);
            if (Array.isArray(parsed)) setPreferredCategories(parsed);
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  // Sort: preferred categories first, then the rest
  const cats = CATEGORIES as readonly string[];
  const sortedCategories = [
    ...preferredCategories.filter((c) => cats.includes(c)),
    ...CATEGORIES.filter((c) => !preferredCategories.includes(c)),
  ];

  const handleCategory = (category: string | null) => {
    if (category) {
      router.push(`/?category=${encodeURIComponent(category)}`);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => handleCategory(null)}
        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
          !activeCategory
            ? "bg-blue-500 text-white"
            : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
        }`}
      >
        Tutte
      </button>
      {sortedCategories.map((cat) => (
        <button
          key={cat}
          onClick={() => handleCategory(cat)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            activeCategory === cat
              ? `${getCategoryColor(cat)} text-white`
              : preferredCategories.includes(cat)
              ? "bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25"
              : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
          }`}
        >
          {getCategoryEmoji(cat)} {cat}
          {preferredCategories.includes(cat) && activeCategory !== cat && (
            <span className="ml-1 text-[10px] text-indigo-400">★</span>
          )}
        </button>
      ))}
    </div>
  );
}
