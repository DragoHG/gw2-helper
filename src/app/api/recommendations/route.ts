import { NextRequest, NextResponse } from "next/server";
import { loadRecommendations } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const modeParam = request.nextUrl.searchParams.get("mode") ?? "all";
  const mode =
    modeParam === "pve" || modeParam === "pvp" || modeParam === "all"
      ? modeParam
      : "all";

  try {
    const data = loadRecommendations(mode);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao carregar recomendações",
      },
      { status: 500 },
    );
  }
}
