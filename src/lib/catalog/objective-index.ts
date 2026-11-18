import { OBJECTIVE_ALIASES } from "@/lib/catalog/event-aliases";
import { normalizeCatalogText } from "@/lib/catalog/normalize";
import {
  loadSectors,
  loadWaypoints,
  saveObjectiveWaypoints,
} from "@/lib/catalog/store";
import { gw2Fetch, gw2FetchMany } from "@/lib/gw2/client";
import type {
  ObjectiveWaypointEntry,
  SectorEntry,
  WaypointEntry,
} from "@/lib/catalog/types";

function dist(a: [number, number], b: [number, number]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function tokenOverlap(a: string, b: string): number {
  const ta = new Set(a.split(" ").filter((t) => t.length > 2));
  const tb = new Set(b.split(" ").filter((t) => t.length > 2));
  if (!ta.size || !tb.size) return 0;
  let hit = 0;
  for (const t of ta) if (tb.has(t)) hit += 1;
  return hit / Math.max(ta.size, tb.size);
}

function nearestWaypointTo(
  coord: [number, number],
  mapId: number | undefined,
  waypoints: WaypointEntry[],
  preferNameKey?: string,
): WaypointEntry | null {
  let best: WaypointEntry | null = null;
  let bestScore = -Infinity;
  const pool = mapId ? waypoints.filter((w) => w.mapId === mapId) : waypoints;
  const search = pool.length ? pool : waypoints;

  for (const wp of search) {
    const d = dist(coord, wp.coord);
    let score = 100000 / (1 + d);
    if (preferNameKey) {
      const bare = preferNameKey;
      const wpBare = wp.nameKey.replace(/ waypoint$/, "");
      if (wp.nameKey.includes(bare) || bare.includes(wpBare)) score += 50000;
      else {
        const overlap = tokenOverlap(bare, wp.nameKey);
        if (overlap >= 0.4) score += overlap * 20000;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = wp;
    }
  }
  return best;
}

function entryFromWaypoint(
  key: string,
  label: string,
  wp: WaypointEntry,
  source: ObjectiveWaypointEntry["source"],
  wikiQuery?: string,
): ObjectiveWaypointEntry {
  return {
    key,
    label,
    waypointId: wp.id,
    waypointName: wp.name,
    mapId: wp.mapId,
    mapName: wp.mapName,
    chatLink: wp.chatLink,
    wikiQuery: wikiQuery ?? label,
    source,
  };
}

function put(
  index: Map<string, ObjectiveWaypointEntry>,
  entry: ObjectiveWaypointEntry,
) {
  const existing = index.get(entry.key);
  // sector/alias vencem fuzzy de achievement bit
  const rank = (s: ObjectiveWaypointEntry["source"]) =>
    s === "sector" ? 3 : s === "alias" ? 2 : 1;
  if (!existing || rank(entry.source) >= rank(existing.source)) {
    index.set(entry.key, entry);
  }
}

function indexSector(
  index: Map<string, ObjectiveWaypointEntry>,
  sector: SectorEntry,
  waypoints: WaypointEntry[],
) {
  const wp = nearestWaypointTo(
    sector.coord,
    sector.mapId,
    waypoints,
    sector.nameKey,
  );
  if (!wp) return;
  put(
    index,
    entryFromWaypoint(sector.nameKey, sector.name, wp, "sector", sector.name),
  );
  // também "Mapa: Setor" como nos bits de explorer
  const mapSector = normalizeCatalogText(`${sector.mapName} ${sector.name}`);
  put(
    index,
    entryFromWaypoint(
      mapSector,
      `${sector.mapName}: ${sector.name}`,
      wp,
      "sector",
      sector.name,
    ),
  );
}

/**
 * Indexa o jogo (não a conta): todo setor → WP mais próximo + aliases +
 * textos de bits de achievements públicos.
 */
export async function buildObjectiveWaypointIndex(options: {
  includeAchievementBits?: boolean;
} = {}): Promise<{ objectiveCount: number }> {
  const waypoints = loadWaypoints();
  const sectors = loadSectors();
  const index = new Map<string, ObjectiveWaypointEntry>();

  for (const sector of sectors) {
    indexSector(index, sector, waypoints);
  }

  // aliases → reutiliza entrada do setor/waypoint já indexada
  for (const [alias, targets] of Object.entries(OBJECTIVE_ALIASES)) {
    const key = normalizeCatalogText(alias);
    for (const target of targets) {
      const tKey = normalizeCatalogText(target);
      const hit =
        index.get(tKey) ||
        [...index.values()].find(
          (e) =>
            e.key.includes(tKey) ||
            tKey.includes(e.key) ||
            normalizeCatalogText(e.waypointName) === tKey,
        );
      if (hit) {
        put(index, { ...hit, key, label: alias, source: "alias", wikiQuery: alias });
        put(index, {
          ...hit,
          key: normalizeCatalogText(`world boss ${alias}`),
          label: `World Boss: ${alias}`,
          source: "alias",
          wikiQuery: alias,
        });
        break;
      }
      const wp = waypoints.find(
        (w) =>
          w.nameKey === tKey ||
          w.nameKey.includes(tKey) ||
          tKey.includes(w.nameKey.replace(/ waypoint$/, "")),
      );
      if (wp) {
        put(index, entryFromWaypoint(key, alias, wp, "alias", alias));
        break;
      }
    }
  }

  if (options.includeAchievementBits !== false) {
    try {
      const ids = await gw2Fetch<number[]>("/achievements");
      const chunk = 200;
      for (let i = 0; i < ids.length; i += chunk) {
        const batch = ids.slice(i, i + chunk);
        const defs = await gw2FetchMany<{
          id: number;
          name?: string;
          bits?: Array<{ text?: string; type?: string }>;
        }>("/achievements", batch, { chunkSize: 200 });

        for (const def of defs) {
          for (const bit of def.bits ?? []) {
            if (!bit.text) continue;
            const raw = bit.text.trim();
            const key = normalizeCatalogText(raw);
            if (!key || key.length < 4) continue;
            if (index.has(key)) continue;

            // tenta match direto com setor/alias já indexado
            let hit = index.get(key);
            if (!hit && key.includes(":")) {
              const right = normalizeCatalogText(key.split(":").slice(1).join(":"));
              hit = index.get(right);
            }
            if (!hit) {
              const stripped = normalizeCatalogText(
                key.replace(/^world boss\s+/, ""),
              );
              hit = index.get(stripped);
            }
            if (!hit) {
              // overlap com setores
              let best: ObjectiveWaypointEntry | null = null;
              let bestScore = 0;
              for (const entry of index.values()) {
                if (entry.source !== "sector") continue;
                const score = tokenOverlap(key, entry.key);
                if (score > bestScore && score >= 0.7) {
                  bestScore = score;
                  best = entry;
                }
              }
              hit = best ?? undefined;
            }
            if (hit) {
              put(index, {
                ...hit,
                key,
                label: raw,
                source: "achievement-bit",
                wikiQuery: raw.replace(/^World Boss:\s*/i, ""),
              });
            }
          }
        }
      }
    } catch {
      // index parcial (setores+aliases) ainda é útil
    }
  }

  const rows = [...index.values()].sort((a, b) => a.key.localeCompare(b.key));
  saveObjectiveWaypoints(rows);
  return { objectiveCount: rows.length };
}

export { OBJECTIVE_ALIASES };
