import { normalizeCatalogText } from "@/lib/catalog/normalize";
import {
  loadMaps,
  loadObjectiveWaypoints,
  loadSectors,
  loadWaypoints,
} from "@/lib/catalog/store";
import type { SectorEntry, WaypointEntry } from "@/lib/catalog/types";
import { OBJECTIVE_ALIASES } from "@/lib/catalog/event-aliases";
import { wikiSearch } from "@/lib/wiki";

export interface WaypointMatch {
  waypoint: WaypointEntry;
  score: number;
  reason: string;
  wikiUrl: string;
  sectorName?: string;
  sectorChatLink?: string;
}

function tokenOverlap(a: string, b: string): number {
  const ta = new Set(a.split(" ").filter((t) => t.length > 2));
  const tb = new Set(b.split(" ").filter((t) => t.length > 2));
  if (!ta.size || !tb.size) return 0;
  let hit = 0;
  for (const t of ta) if (tb.has(t)) hit += 1;
  return hit / Math.max(ta.size, tb.size);
}

function dist(a: [number, number], b: [number, number]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function nearestWaypointTo(
  coord: [number, number],
  mapId: number | undefined,
  waypoints: WaypointEntry[],
  preferNameKey?: string,
): WaypointEntry | null {
  let best: WaypointEntry | null = null;
  let bestScore = -Infinity;

  const pool = mapId
    ? waypoints.filter((w) => w.mapId === mapId)
    : waypoints;
  const search = pool.length ? pool : waypoints;

  for (const wp of search) {
    const d = dist(coord, wp.coord);
    // Distância em unidades continentais: ~800 ≈ bem perto
    let score = 100000 / (1 + d);
    if (preferNameKey) {
      const overlap = tokenOverlap(preferNameKey, wp.nameKey);
      if (wp.nameKey.includes(preferNameKey) || preferNameKey.includes(wp.nameKey.replace(/ waypoint$/, ""))) {
        score += 50000;
      } else if (overlap >= 0.4) {
        score += overlap * 20000;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = wp;
    }
  }
  return best;
}

function expandHints(hints: string[]): string[] {
  const out: string[] = [];
  for (const raw of hints) {
    const cleaned = normalizeCatalogText(raw);
    if (!cleaned) continue;
    out.push(cleaned);

    // "Bloodtide Coast: Challdar Gorges" → setor + mapa
    if (cleaned.includes(":")) {
      const [left, ...rest] = cleaned.split(":");
      const right = rest.join(":").trim();
      if (left.trim()) out.push(left.trim());
      if (right) out.push(right);
    }

    // "World Boss: Great Jungle Wurm" → alias
    const withoutPrefix = cleaned
      .replace(/^world boss\s+/, "")
      .replace(/^defeat\s+/, "")
      .trim();
    if (withoutPrefix && withoutPrefix !== cleaned) out.push(withoutPrefix);

    for (const [key, aliases] of Object.entries(OBJECTIVE_ALIASES)) {
      if (cleaned.includes(key) || withoutPrefix.includes(key)) {
        out.push(...aliases);
      }
    }
  }
  // dedupe preserve order
  return [...new Set(out.filter(Boolean))];
}

function matchSector(
  hint: string,
  sectors: SectorEntry[],
): { sector: SectorEntry; score: number; reason: string } | null {
  let best: { sector: SectorEntry; score: number; reason: string } | null = null;

  for (const sector of sectors) {
    let score = 0;
    let reason = "";
    if (sector.nameKey === hint) {
      score = 1;
      reason = `Setor exato "${sector.name}"`;
    } else if (
      sector.nameKey.includes(hint) ||
      hint.includes(sector.nameKey)
    ) {
      // evitar matches curtos demais (ex.: "bay")
      if (Math.min(hint.length, sector.nameKey.length) < 5 && hint !== sector.nameKey) {
        continue;
      }
      score = 0.92;
      reason = `Setor "${sector.name}"`;
    } else {
      const overlap = tokenOverlap(hint, sector.nameKey);
      if (overlap >= 0.6) {
        score = overlap * 0.88;
        reason = `Setor parecido "${sector.name}"`;
      }
    }
    if (score < 0.55) continue;
    if (!best || score > best.score) best = { sector, score, reason };
  }
  return best;
}

/** Encontra waypoint mais próximo por texto de bit/mapa/achievement. */
export function findNearestWaypoint(
  hints: Array<string | undefined | null>,
): WaypointMatch | null {
  const waypoints = loadWaypoints();
  if (!waypoints.length) return null;

  const wpById = new Map(waypoints.map((w) => [w.id, w] as const));
  const objectiveIndex = new Map(
    loadObjectiveWaypoints().map((o) => [o.key, o] as const),
  );

  const sectors = loadSectors();
  const maps = loadMaps();
  const mapByName = new Map(
    maps.map((m) => [normalizeCatalogText(m.name), m] as const),
  );

  const cleaned = expandHints(
    hints.filter(Boolean).map((h) => String(h)),
  );
  if (!cleaned.length) return null;

  const state: { best: WaypointMatch | null } = { best: null };

  const consider = (candidate: WaypointMatch) => {
    if (!state.best || candidate.score > state.best.score) {
      state.best = candidate;
    }
  };

  // 0) índice pré-computado do DB do jogo (vale para qualquer conta/momento)
  for (const hint of cleaned) {
    const hit = objectiveIndex.get(hint);
    if (!hit) continue;
    const wp = wpById.get(hit.waypointId);
    if (!wp) continue;
    consider({
      waypoint: wp,
      score: hit.source === "sector" ? 1 : hit.source === "alias" ? 0.98 : 0.95,
      reason: `Índice do jogo (${hit.source}): ${hit.label} → ${hit.waypointName}`,
      wikiUrl: wikiSearch(hit.wikiQuery),
      sectorName: hit.source === "sector" ? hit.label : undefined,
    });
  }
  if (state.best && state.best.score >= 0.95) return state.best;

  for (const hint of cleaned) {
    // 1) setor → waypoint mais próximo por coordenada
    const sectorHit = matchSector(hint, sectors);
    if (sectorHit) {
      const wp = nearestWaypointTo(
        sectorHit.sector.coord,
        sectorHit.sector.mapId,
        waypoints,
        sectorHit.sector.nameKey,
      );
      if (wp) {
        consider({
          waypoint: wp,
          score: sectorHit.score,
          reason: `${sectorHit.reason} → WP mais próximo ${wp.name}`,
          wikiUrl: wikiSearch(sectorHit.sector.name),
          sectorName: sectorHit.sector.name,
          sectorChatLink: sectorHit.sector.chatLink,
        });
      }
    }

    // 2) mapa por nome → WP central-ish (primeiro do mapa; preferir nome com Waypoint)
    const map = mapByName.get(hint);
    if (map) {
      const onMap = waypoints.filter((w) => w.mapId === map.id);
      if (onMap.length) {
        const wp =
          onMap.find((w) => /waypoint/i.test(w.name)) ?? onMap[0];
        consider({
          waypoint: wp,
          score: 0.72,
          reason: `Mapa "${map.name}" → ${wp.name}`,
          wikiUrl: wikiSearch(map.name),
        });
      }
    }

    // 3) nome de waypoint
    for (const wp of waypoints) {
      let score = 0;
      let reason = "";
      if (wp.nameKey === hint) {
        score = 1;
        reason = "Nome exato do waypoint";
      } else if (wp.nameKey.includes(hint) || hint.includes(wp.nameKey)) {
        if (Math.min(hint.length, wp.nameKey.length) < 6) continue;
        score = 0.9;
        reason = "Nome parcial do waypoint";
      } else {
        const overlap = tokenOverlap(hint, wp.nameKey);
        const mapOverlap = tokenOverlap(
          hint,
          normalizeCatalogText(wp.mapName),
        );
        score = Math.max(overlap * 0.75, mapOverlap * 0.55);
        reason =
          overlap >= mapOverlap
            ? "Similaridade com waypoint"
            : `Mapa ${wp.mapName}`;
      }
      if (score < 0.45) continue;
      consider({
        waypoint: wp,
        score,
        reason,
        wikiUrl: wikiSearch(wp.mapName),
      });
    }
  }

  return state.best;
}
