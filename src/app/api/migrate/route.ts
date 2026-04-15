import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: Request) {
  // Protect with CRON_SECRET
  const secret = request.headers.get("x-migrate-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  try {
    const { stdout, stderr } = await execAsync("npx prisma db push --accept-data-loss", {
      cwd: process.cwd(),
      timeout: 60_000,
    });

    return NextResponse.json({
      ok: true,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    });
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
