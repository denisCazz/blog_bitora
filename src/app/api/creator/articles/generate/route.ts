import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { generateArticle } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    await requireRole(["CREATOR", "ADMIN"]);

    const { topic } = await request.json();

    if (!topic || typeof topic !== "string" || topic.trim().length < 3) {
      return NextResponse.json(
        { error: "Argomento richiesto (min 3 caratteri)" },
        { status: 400 }
      );
    }

    const article = await generateArticle(topic.trim());

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
