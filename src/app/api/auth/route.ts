import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// GET /api/auth — return current user (replaces old /api/auth/me logic)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        onboardingComplete: user.onboardingComplete,
        preferredCategories: user.preferredCategories,
      },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
