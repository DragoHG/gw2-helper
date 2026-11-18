import { loadObjectiveWaypoints } from "@/lib/catalog/store";
import { rankAchievements } from "@/lib/achievements/analyze";
import { extractProgressGoals } from "@/lib/events/goals";
import { buildEventTimeline } from "@/lib/events/timeline";
import { findNearestWaypoint } from "@/lib/geo/waypoints";
import type { AccountSnapshot } from "@/lib/gw2/types";
import { rankMasterySteps } from "@/lib/masteries/analyze";
import { parseVaultTracks } from "@/lib/vault/parse";
import { resolveVaultObjective } from "@/lib/vault/guide";
import { wikiSearch } from "@/lib/wiki";
import { normalizeCatalogText } from "@/lib/catalog/normalize";

export interface MapSessionObjective {
  id: string;
  kind: "achievement" | "vault" | "mastery" | "event" | "goal";
  label: string;
  weight: number;
  chatLink?: string;
  teleportLabel?: string;
  how?: string;
}

export interface MapSession {
  mapId: number;
  mapName: string;
  score: number;
  objectives: MapSessionObjective[];
  chatLink?: string;
  teleportLabel?: string;
  why: string;
  how: string;
  wikiUrl: string;
  eventBoost: boolean;
}

interface Located {
  mapId: number;
  mapName: string;
  chatLink?: string;
  waypointName?: string;
  objective: MapSessionObjective;
}

function resolveLocation(hints: string[]): {
  mapId?: number;
  mapName?: string;
  chatLink?: string;
  waypointName?: string;
} {
  const index = loadObjectiveWaypoints();
  for (const hint of hints) {
    const key = normalizeCatalogText(hint);
    if (!key) continue;
    const hit = index.find(
      (o) => o.key === key || o.key.includes(key) || key.includes(o.key),
    );
    if (hit?.mapId) {
      return {
        mapId: hit.mapId,
        mapName: hit.mapName,
        chatLink: hit.chatLink,
        waypointName: hit.waypointName,
      };
    }
  }
  const wp = findNearestWaypoint(hints);
  if (!wp) return {};
  return {
    mapId: wp.waypoint.mapId,
    mapName: wp.waypoint.mapName,
    chatLink: wp.waypoint.chatLink,
    waypointName: wp.waypoint.name,
  };
}

export function buildMapSessions(
  snapshot: AccountSnapshot,
  options: {
    limit?: number;
    horizonHours?: number;
    /** Pula timeline de eventos (mais rápido - bom na home). */
    skipEvents?: boolean;
    /** Pula extractProgressGoals completo (usa só ach/vault/mastery). */
    light?: boolean;
  } = {},
): MapSession[] {
  const limit = options.limit ?? 5;
  const horizonHours = options.horizonHours ?? 8;
  const located: Located[] = [];

  if (!options.light) try {
    const goals = extractProgressGoals(snapshot);
    for (const g of goals.slice(0, 40)) {
      const loc = resolveLocation([g.label, ...g.matchKeys.slice(0, 3)]);
      if (!loc.mapId || !loc.mapName) continue;
      located.push({
        mapId: loc.mapId,
        mapName: loc.mapName,
        chatLink: loc.chatLink,
        waypointName: loc.waypointName,
        objective: {
          id: g.id,
          kind: "goal",
          label: g.label,
          weight: g.weight,
          chatLink: loc.chatLink,
          teleportLabel: loc.waypointName
            ? `${loc.waypointName} - ${loc.mapName}`
            : undefined,
        },
      });
    }
  } catch {
    /* goals opcional */
  }

  try {
    const ach = rankAchievements(snapshot, {
      mode: "pve",
      limit: 25,
      minPct: 0.05,
    });
    for (const a of ach) {
      const hints = [
        a.nextBits[0],
        a.nextBits[1],
        a.name,
        a.requirement,
      ].filter(Boolean) as string[];
      const loc = resolveLocation(hints);
      if (!loc.mapId || !loc.mapName) continue;
      located.push({
        mapId: loc.mapId,
        mapName: loc.mapName,
        chatLink: loc.chatLink ?? a.chatLink,
        waypointName: loc.waypointName,
        objective: {
          id: `ach-${a.id}`,
          kind: "achievement",
          label: `${a.name}${a.nextBits[0] ? `: ${a.nextBits[0]}` : ""}`,
          weight: 85,
          chatLink: a.chatLink ?? loc.chatLink,
          teleportLabel: a.teleportLabel,
          how: a.whyEasy,
        },
      });
    }
  } catch {
    /* ach opcional */
  }

  try {
    for (const track of parseVaultTracks(snapshot)) {
      for (const obj of track.objectives) {
        if (obj.claimed) continue;
        const guide = resolveVaultObjective(obj.title);
        const loc = resolveLocation([obj.title, guide.where]);
        if (!loc.mapId || !loc.mapName) continue;
        located.push({
          mapId: loc.mapId,
          mapName: loc.mapName,
          chatLink: guide.chatLink ?? loc.chatLink,
          waypointName: loc.waypointName,
          objective: {
            id: `vault-${obj.id}`,
            kind: "vault",
            label: `Vault: ${obj.title}`,
            weight: track.key === "daily" ? 70 : 45,
            chatLink: guide.chatLink ?? loc.chatLink,
            teleportLabel: guide.teleportLabel,
            how: guide.how,
          },
        });
      }
    }
  } catch {
    /* vault opcional */
  }

  try {
    for (const step of rankMasterySteps(snapshot, { limit: 12 })) {
      const loc = resolveLocation([
        step.where,
        step.requirement,
        ...step.xpGuide.wpHints,
      ]);
      if (!loc.mapId || !loc.mapName) continue;
      located.push({
        mapId: loc.mapId,
        mapName: loc.mapName,
        chatLink: step.chatLink ?? loc.chatLink,
        waypointName: loc.waypointName,
        objective: {
          id: `mastery-${step.trackId}-${step.nextLevelIndex}`,
          kind: "mastery",
          label: `Mastery: ${step.trackName} → ${step.nextLevelName}`,
          weight: 75,
          chatLink: step.chatLink ?? loc.chatLink,
          teleportLabel: step.teleportLabel,
          how: step.xpGuide.how,
        },
      });
    }
  } catch {
    /* mastery opcional */
  }

  let eventMapIds = new Set<number>();
  if (!options.skipEvents) try {
    const timeline = buildEventTimeline(snapshot, { horizonHours });
    for (const occ of [
      timeline.primary,
      ...timeline.bridges,
      ...timeline.upcoming.slice(0, 8),
    ]) {
      if (!occ) continue;
      const loc = resolveLocation([occ.name, occ.groupName]);
      if (loc.mapId) {
        eventMapIds.add(loc.mapId);
        located.push({
          mapId: loc.mapId,
          mapName: loc.mapName!,
          chatLink: occ.chatLink ?? loc.chatLink,
          waypointName: loc.waypointName,
          objective: {
            id: `event-${occ.eventId}-${occ.startAt}`,
            kind: "event",
            label: `Evento: ${occ.name}`,
            weight: occ.isActive ? 110 : 90,
            chatLink: occ.chatLink ?? loc.chatLink,
            teleportLabel: loc.waypointName
              ? `${loc.waypointName} - ${loc.mapName}`
              : undefined,
            how: occ.isActive
              ? "Já está na janela - vá agora."
              : `Começa em ~${occ.minutesUntilStart} min.`,
          },
        });
      }
    }
  } catch {
    eventMapIds = new Set();
  }

  const byMap = new Map<number, Located[]>();
  for (const row of located) {
    const list = byMap.get(row.mapId) ?? [];
    list.push(row);
    byMap.set(row.mapId, list);
  }

  const sessions: MapSession[] = [];
  for (const [mapId, rows] of byMap) {
    // dedupe por label
    const seen = new Set<string>();
    const objectives: MapSessionObjective[] = [];
    for (const r of rows.sort((a, b) => b.objective.weight - a.objective.weight)) {
      const key = r.objective.label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      objectives.push(r.objective);
      if (objectives.length >= 6) break;
    }
    if (objectives.length < 2) continue;

    const kinds = new Set(objectives.map((o) => o.kind));
    const diversity = kinds.size;
    const weightSum = objectives.reduce((s, o) => s + o.weight, 0);
    const eventBoost = eventMapIds.has(mapId);
    const score = weightSum * (1 + diversity * 0.15) * (eventBoost ? 1.2 : 1);
    const primary = rows.find((r) => r.chatLink) ?? rows[0];
    const mapName = primary.mapName;

    sessions.push({
      mapId,
      mapName,
      score: Number(score.toFixed(1)),
      objectives,
      chatLink: primary.chatLink,
      teleportLabel: primary.waypointName
        ? `${primary.waypointName} - ${mapName}`
        : mapName,
      why: `Neste mapa você progride ${objectives.length} coisas de uma vez (${[...kinds].join(", ")}).`,
      how: `Teleporte, faça na ordem: ${objectives
        .slice(0, 4)
        .map((o) => o.label)
        .join(" → ")}.`,
      wikiUrl: wikiSearch(mapName),
      eventBoost,
    });
  }

  return sessions.sort((a, b) => b.score - a.score).slice(0, limit);
}
