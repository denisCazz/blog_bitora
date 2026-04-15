import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const body = await request.json();
    const { searchPreference } = body;

    if (typeof searchPreference !== "string") {
      return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
    }

    const trimmed = searchPreference.trim().slice(0, 500);

    await prisma.user.update({
      where: { id: user.id },
      data: { searchPreference: trimmed || null },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Preferences update error:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
