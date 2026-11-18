import { NextRequest, NextResponse } from "next/server";
import { loadLatestSnapshot } from "@/lib/db";
import { buildEventTimeline, eventTimelineSummary } from "@/lib/events/timeline";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const snapshot = loadLatestSnapshot();
  if (!snapshot) {
    return NextResponse.json(
      { error: "Nenhum snapshot. Rode o sync." },
      { status: 404 },
    );
  }

  const hours = Number(request.nextUrl.searchParams.get("hours") ?? "8");
  const horizonHours = Number.isFinite(hours) ? Math.min(24, Math.max(1, hours)) : 8;
  const summaryOnly = request.nextUrl.searchParams.get("summary") === "1";

  if (summaryOnly) {
    return NextResponse.json(eventTimelineSummary(snapshot, { horizonHours }));
  }

  const timeline = buildEventTimeline(snapshot, { horizonHours });
  return NextResponse.json({
    now: timeline.now,
    horizonHours: timeline.horizonHours,
    disclaimer: timeline.disclaimer,
    primary: timeline.primary,
    bridges: timeline.bridges,
    upcoming: timeline.upcoming.slice(0, 20),
  });
}
