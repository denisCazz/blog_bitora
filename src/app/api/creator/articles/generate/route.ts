import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { generateArticle } from "@/lib/ai";

const BLOCKED_KEYWORDS = [
  "bomba", "esplosivo", "arma", "droga", "stupefacente", "hacking", "malware",
  "terrorism", "terrorismo", "suicidio", "autolesionismo", "pedofilia",
];

export async function POST(request: Request) {
  try {
    await requireRole(["CREATOR", "ADMIN"]);

    const body = await request.json();
    const { topic, target, tone, keywords } = body;

    if (!topic || typeof topic !== "string" || topic.trim().length < 3) {
      return NextResponse.json(
        { error: "Argomento richiesto (min 3 caratteri)" },
        { status: 400 }
      );
    }

    const fullText = [topic, keywords].filter(Boolean).join(" ").toLowerCase();
    const blocked = BLOCKED_KEYWORDS.find((kw) => fullText.includes(kw));
    if (blocked) {
      return NextResponse.json(
        { error: "L'argomento non è consentito su questa piattaforma." },
        { status: 400 }
      );
    }

    const article = await generateArticle(topic.trim(), {
      target: typeof target === "string" ? target : undefined,
      tone: typeof tone === "string" ? tone : undefined,
      keywords: typeof keywords === "string" ? keywords : undefined,
    });

    return NextResponse.json({ article });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Errore nella generazione dell'articolo" },
      { status: 500 }
    );
  }
}
