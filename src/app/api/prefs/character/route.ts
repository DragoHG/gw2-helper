import { NextRequest, NextResponse } from "next/server";
import { loadLatestSnapshot, setSelectedCharacterName } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { name?: string };
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
    }
    const snapshot = loadLatestSnapshot();
    if (!snapshot?.characters.some((c) => c.core.name === name)) {
      return NextResponse.json(
        { error: "Personagem não encontrado no snapshot" },
        { status: 404 },
      );
    }
    setSelectedCharacterName(name);
    return NextResponse.json({ ok: true, name });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro" },
      { status: 500 },
    );
  }
}
