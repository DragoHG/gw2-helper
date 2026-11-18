import { gw2Fetch } from "@/lib/gw2/client";
import type { WvwMatchSummary, WvwTeamColor } from "@/lib/wvw/types";

const COLORS: WvwTeamColor[] = ["red", "blue", "green"];

interface RawMatch {
  id: string;
  worlds?: Record<WvwTeamColor, number>;
  all_worlds?: Record<WvwTeamColor, number[]>;
  scores?: Record<WvwTeamColor, number>;
  victory_points?: Record<WvwTeamColor, number>;
  skirmishes?: Array<{
    id: number;
    scores: Record<WvwTeamColor, number>;
  }>;
}

function teamForWorld(match: RawMatch, worldId: number): WvwTeamColor | null {
  for (const color of COLORS) {
    if (match.worlds?.[color] === worldId) return color;
    if (match.all_worlds?.[color]?.includes(worldId)) return color;
  }
  return null;
}

/** Match atual do world (API pública - sem key). */
export async function fetchWvwMatchForWorld(
  worldId: number,
): Promise<WvwMatchSummary | null> {
  if (!worldId) return null;
  try {
    const match = await gw2Fetch<RawMatch>("/wvw/matches", {
      params: { world: String(worldId) },
    });
    const team = teamForWorld(match, worldId);
    const worldIds = new Set<number>();
    for (const color of COLORS) {
      if (match.worlds?.[color]) worldIds.add(match.worlds[color]);
      for (const id of match.all_worlds?.[color] ?? []) worldIds.add(id);
    }
    const worlds = worldIds.size
      ? await gw2Fetch<Array<{ id: number; name: string }>>("/worlds", {
          params: { ids: [...worldIds].join(",") },
        })
      : [];
    const nameById = new Map(worlds.map((w) => [w.id, w.name]));
    const primaryWorldNames = {
      red: nameById.get(match.worlds?.red ?? -1) ?? "-",
      blue: nameById.get(match.worlds?.blue ?? -1) ?? "-",
      green: nameById.get(match.worlds?.green ?? -1) ?? "-",
    };
    const linked = team
      ? (match.all_worlds?.[team] ?? [])
          .map((id) => nameById.get(id))
          .filter((n): n is string => Boolean(n))
      : [];
    const lastSkirmish = match.skirmishes?.[match.skirmishes.length - 1];
    return {
      matchId: match.id,
      team,
      victoryPoints: match.victory_points ?? null,
      skirmishScores: lastSkirmish?.scores ?? null,
      linkedWorldNames: linked,
      primaryWorldNames,
    };
  } catch {
    return null;
  }
}
