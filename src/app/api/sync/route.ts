import { NextResponse } from "next/server";
import { refreshCatalog } from "@/lib/catalog/refresh";
import { saveSnapshot } from "@/lib/db";
import { resolveAccountAccess } from "@/lib/gw2/access";
import { Gw2ApiError } from "@/lib/gw2/client";
import { syncAccount } from "@/lib/gw2/sync";
import { buildAllRecommendations } from "@/lib/recommend";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST() {
  try {
    const catalog = await refreshCatalog();
    const snapshot = await syncAccount();
    const recommendations = buildAllRecommendations(snapshot);
    const saved = saveSnapshot(snapshot, recommendations);

    return NextResponse.json({
      ok: true,
      snapshotId: saved.snapshotId,
      filePath: saved.filePath,
      syncedAt: snapshot.syncedAt,
      catalog: {
        updated: catalog.updated,
        buildId: catalog.buildId,
        waypointCount: catalog.waypointCount,
        sectorCount: catalog.sectorCount,
        objectiveCount: catalog.objectiveCount,
        eventCount: catalog.eventCount,
        scheduleVersion: catalog.scheduleVersion,
        error: catalog.error ?? null,
      },
      account: {
        name: snapshot.account.name,
        access: snapshot.account.access,
        accessResolved: resolveAccountAccess(snapshot.account.access),
        fractalLevel: snapshot.account.fractal_level ?? null,
      },
      characters: snapshot.characters.map((c) => ({
        name: c.core.name,
        profession: c.core.profession,
        level: c.core.level,
      })),
      recommendations: {
        total: recommendations.length,
        pve: recommendations.filter((r) => r.mode === "pve").length,
        pvp: recommendations.filter((r) => r.mode === "pvp").length,
        top: recommendations.slice(0, 8),
      },
    });
  } catch (error) {
    const status =
      error instanceof Gw2ApiError
        ? error.status
        : error instanceof Error && error.message.includes("GW2_API_KEY")
          ? 400
          : 500;

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Falha no sync",
      },
      { status },
    );
  }
}
