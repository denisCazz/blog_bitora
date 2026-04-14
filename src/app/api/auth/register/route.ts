import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    // Validate input
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Email non valida" },
        { status: 400 }
      );
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "La password deve avere almeno 8 caratteri" },
        { status: 400 }
      );
    }
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Il nome deve avere almeno 2 caratteri" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const trimmedName = name.trim().slice(0, 100);

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Questa email è già registrata" },
        { status: 409 }
      );
    }

    // Check if this is the admin email
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const role = adminEmail && normalizedEmail === adminEmail ? "ADMIN" : "READER";

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: trimmedName,
        passwordHash,
        role: role as "ADMIN" | "READER",
      },
    });

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
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Errore durante la registrazione" },
      { status: 500 }
    );
  }
}
