import { NextResponse } from "next/server";
import { getLatestSnapshotRow, loadLatestSnapshot } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const row = getLatestSnapshotRow();
    const snapshot = loadLatestSnapshot();
    if (!row || !snapshot) {
      return NextResponse.json(
        { error: "Nenhum snapshot ainda. Rode o sync." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: row.id,
      syncedAt: row.synced_at,
      summary: JSON.parse(row.summary_json),
      account: snapshot.account,
      tokenPermissions: snapshot.tokenInfo.permissions,
      characters: snapshot.characters.map((c) => ({
        name: c.core.name,
        race: c.core.race,
        profession: c.core.profession,
        level: c.core.level,
        age: c.core.age,
        deaths: c.core.deaths,
        equipmentCount: c.equipment.length,
        crafting: c.crafting ?? [],
        heropoints: c.heropoints?.length ?? 0,
      })),
      wallet: snapshot.wallet,
      masteryPoints: snapshot.masteryPoints,
      masteries: snapshot.masteries,
      mounts: snapshot.mounts,
      fractalLevel: snapshot.account.fractal_level ?? null,
      pvp: {
        stats: snapshot.pvp.stats,
        standingsCount: snapshot.pvp.standings.length,
      },
      counts: {
        achievements: snapshot.achievements.length,
        achievementsDone: snapshot.achievements.filter((a) => a.done).length,
        skins: snapshot.skins.length,
        dyes: snapshot.dyes.length,
        recipes: snapshot.recipes.length,
        legendaryArmory: snapshot.legendaryArmory.length,
        materials: snapshot.materials.length,
        bankSlots: snapshot.bank.filter(Boolean).length,
      },
      itemsIndexSize: Object.keys(snapshot.itemsIndex).length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao ler snapshot",
      },
      { status: 500 },
    );
  }
}
