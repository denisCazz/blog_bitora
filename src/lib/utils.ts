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
  "AI",
  "Cybersecurity",
  "Mobile",
  "Cloud",
  "Startup",
  "Hardware",
  "Software",
  "Web3",
  "Green Tech",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    AI: "bg-purple-500",
    Cybersecurity: "bg-red-500",
    Mobile: "bg-blue-500",
    Cloud: "bg-cyan-500",
    Startup: "bg-green-500",
    Hardware: "bg-orange-500",
    Software: "bg-indigo-500",
    Web3: "bg-yellow-500",
    "Green Tech": "bg-emerald-500",
  };
  return colors[category] || "bg-gray-500";
}

export function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    AI: "🤖",
    Cybersecurity: "🔒",
    Mobile: "📱",
    Cloud: "☁️",
    Startup: "🚀",
    Hardware: "🔧",
    Software: "💻",
    Web3: "🌐",
    "Green Tech": "🌱",
  };
  return emojis[category] || "📰";
}
