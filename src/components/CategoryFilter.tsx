"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES, getCategoryColor, getCategoryEmoji } from "@/lib/utils";

export default function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category");

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
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => handleCategory(cat)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            activeCategory === cat
              ? `${getCategoryColor(cat)} text-white`
              : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
          }`}
        >
          {getCategoryEmoji(cat)} {cat}
        </button>
      ))}
    </div>
  );
}
