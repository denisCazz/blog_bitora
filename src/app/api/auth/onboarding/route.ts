import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    const { role, preferredCategories } = await request.json();

    // Validate role choice
    if (role && !["READER", "CREATOR"].includes(role)) {
      return NextResponse.json(
        { error: "Ruolo non valido" },
        { status: 400 }
      );
    }

    // If choosing CREATOR, check the cap of 50
    if (role === "CREATOR") {
      const creatorCount = await prisma.user.count({
        where: { role: "CREATOR" },
      });
      if (creatorCount >= 50) {
        return NextResponse.json(
          { error: "Limite di 50 Creator raggiunto. Riprova più tardi." },
          { status: 409 }
        );
      }
    }

    // Validate categories
    let categories: string | null = null;
    if (Array.isArray(preferredCategories) && preferredCategories.length > 0) {
      categories = JSON.stringify(
        preferredCategories.filter((c: unknown) => typeof c === "string").slice(0, 20)
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(role && user.role !== "ADMIN" ? { role } : {}),
        preferredCategories: categories,
        onboardingComplete: true,
      },
    });

    return NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        onboardingComplete: updated.onboardingComplete,
        preferredCategories: updated.preferredCategories,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Errore durante l'onboarding" },
      { status: 500 }
    );
  }
}
