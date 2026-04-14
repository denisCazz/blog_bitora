import slugify from "slugify";

export function createSlug(title: string): string {
  return slugify(title, {
    lower: true,
    strict: true,
    locale: "it",
  });
}

export function estimateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const CATEGORIES = [
  "Tecnologia",
  "Scienza",
  "Economia",
  "Politica",
  "Cultura",
  "Sport",
  "Salute",
  "Ambiente",
  "Intrattenimento",
  "Lifestyle",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Tecnologia: "bg-blue-500",
    Scienza: "bg-cyan-500",
    Economia: "bg-green-500",
    Politica: "bg-red-500",
    Cultura: "bg-purple-500",
    Sport: "bg-orange-500",
    Salute: "bg-rose-500",
    Ambiente: "bg-emerald-500",
    Intrattenimento: "bg-yellow-500",
    Lifestyle: "bg-pink-500",
  };
  return colors[category] || "bg-gray-500";
}

export function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    Tecnologia: "💻",
    Scienza: "🔬",
    Economia: "📈",
    Politica: "🏛️",
    Cultura: "🎭",
    Sport: "⚽",
    Salute: "🏥",
    Ambiente: "🌿",
    Intrattenimento: "🎬",
    Lifestyle: "✨",
  };
  return emojis[category] || "📰";
}
