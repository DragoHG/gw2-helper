import { NextRequest, NextResponse } from "next/server";
import { togglePinnedAchievement } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { id?: number };
    if (!body.id || !Number.isFinite(body.id)) {
      return NextResponse.json({ error: "id inválido" }, { status: 400 });
    }
    const pinned = togglePinnedAchievement(Number(body.id));
    return NextResponse.json({ ok: true, id: body.id, pinned });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro" },
      { status: 500 },
    );
  }
}
