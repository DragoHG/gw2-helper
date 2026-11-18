import { NextRequest, NextResponse } from "next/server";
import {
  achievementSummary,
  rankAchievements,
} from "@/lib/achievements/analyze";
import { loadLatestSnapshot } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const snapshot = loadLatestSnapshot();
  if (!snapshot) {
    return NextResponse.json(
      { error: "Nenhum snapshot. Rode o sync." },
      { status: 404 },
    );
  }

  const modeParam = request.nextUrl.searchParams.get("mode") ?? "any";
  const mode =
    modeParam === "pve" || modeParam === "pvp" || modeParam === "any"
      ? modeParam
      : "any";
  const minPct = Number(request.nextUrl.searchParams.get("minPct") ?? "0.05");
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "40");

  return NextResponse.json({
    summary: achievementSummary(snapshot),
    easiest: rankAchievements(snapshot, {
      mode,
      minPct: Number.isFinite(minPct) ? minPct : 0.05,
      limit: Number.isFinite(limit) ? limit : 40,
    }),
  });
}
