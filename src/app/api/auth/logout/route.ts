import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession, COOKIE_NAME, clearSessionCookie } from "@/lib/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (token) {
      await deleteSession(token);
    }

    await clearSessionCookie();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Errore durante il logout" },
      { status: 500 }
    );
  }
}
