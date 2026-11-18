import { NextResponse } from "next/server";
import { exportPrefsBackup, importPrefsBackup } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(exportPrefsBackup());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "export failed" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const backup = importPrefsBackup(body);
    return NextResponse.json({ ok: true, backup });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "import failed" },
      { status: 400 },
    );
  }
}
