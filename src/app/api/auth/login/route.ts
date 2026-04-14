import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  createSession,
  setSessionCookie,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email richiesta" },
        { status: 400 }
      );
    }
    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password richiesta" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Credenziali non valide" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Credenziali non valide" },
        { status: 401 }
      );
    }

    const token = await createSession(user.id);
    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        onboardingComplete: user.onboardingComplete,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Errore durante il login" },
      { status: 500 }
    );
  }
}
