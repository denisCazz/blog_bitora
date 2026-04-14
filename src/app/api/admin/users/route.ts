import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }
    return NextResponse.json({ error: "Errore server" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireRole(["ADMIN"]);

    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId e role richiesti" },
        { status: 400 }
      );
    }

    if (!["READER", "CREATOR", "PLUS", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Ruolo non valido" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }
    return NextResponse.json({ error: "Errore server" }, { status: 500 });
  }
}
