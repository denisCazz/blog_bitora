import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { stdout, stderr } = await execAsync(
      "npx prisma db push --accept-data-loss",
      { cwd: process.cwd(), timeout: 60_000 }
    );

    return NextResponse.json({ ok: true, stdout: stdout.trim(), stderr: stderr.trim() });
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    return NextResponse.json(
      {
        ok: false,
        error: err.message,
        stdout: err.stdout?.trim(),
        stderr: err.stderr?.trim(),
      },
      { status: 500 }
    );
  }
}
