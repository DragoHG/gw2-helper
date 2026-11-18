import { NextResponse } from "next/server";
import { loadLatestSnapshot } from "@/lib/db";
import { buildAccountRoadmap } from "@/lib/roadmap/build";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = loadLatestSnapshot();
    if (!snapshot) {
      return NextResponse.json(
        { error: "Sem snapshot. Atualize a conta primeiro." },
        { status: 404 },
      );
    }
    const roadmap = buildAccountRoadmap(snapshot);
    return NextResponse.json({
      stageLabel: roadmap.stageLabel,
      stageSummary: roadmap.stageSummary,
      accessSummary: roadmap.accessSummary,
      generatedAt: roadmap.generatedAt,
      session: roadmap.session,
      count: roadmap.timeline.length,
      timeline: roadmap.timeline,
      lanes: Object.fromEntries(
        Object.entries(roadmap.lanes).map(([k, v]) => [
          k,
          v.map((s) => ({ id: s.id, title: s.title, priority: s.priority })),
        ]),
      ),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao montar a linha do tempo",
      },
      { status: 500 },
    );
  }
}
