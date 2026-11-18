import { loadMasteries } from "@/lib/catalog/store";
import type { MasteryTrackEntry } from "@/lib/catalog/types";
import { findNearestWaypoint } from "@/lib/geo/waypoints";
import type { AccountSnapshot } from "@/lib/gw2/types";
import {
  accountHasMasteryRegion,
  findRegionTotals,
  regionMapHints,
} from "@/lib/masteries/regions";
import { resolveMasteryXpGuide } from "@/lib/masteries/xp-guide";
import { wikiSearch } from "@/lib/wiki";

export interface RankedMasteryStep {
  trackId: number;
  trackName: string;
  region: string;
  /** Índice 0-based do próximo nível a desbloquear. */
  nextLevelIndex: number;
  nextLevelName: string;
  nextIcon?: string;
  pointCost: number;
  expCost: number;
  levelsDone: number;
  levelsTotal: number;
  pointsFree: number;
  canAffordPoints: boolean;
  easeScore: number;
  whyEasy: string;
  how: string;
  where: string;
  instruction: string;
  description: string;
  requirement: string;
  chatLink?: string;
  teleportLabel?: string;
  wikiUrl: string;
  xpGuide: ReturnType<typeof resolveMasteryXpGuide>;
}

function progressMap(snapshot: AccountSnapshot): Map<number, number> {
  const m = new Map<number, number>();
  for (const row of snapshot.masteries ?? []) {
    // API: level = índice 0-based do máximo desbloqueado
    m.set(row.id, row.level);
  }
  return m;
}

function easeScore(opts: {
  pointCost: number;
  canAfford: boolean;
  levelsLeft: number;
  levelsTotal: number;
  utilityBoost: number;
}): number {
  const afford = opts.canAfford ? 40 : 10;
  const cheap = Math.max(0, 25 - opts.pointCost * 3);
  const nearEnd =
    opts.levelsTotal > 0
      ? (1 - opts.levelsLeft / opts.levelsTotal) * 20
      : 0;
  return Number((afford + cheap + nearEnd + opts.utilityBoost).toFixed(2));
}

function utilityBoost(track: MasteryTrackEntry, snapshot: AccountSnapshot): number {
  const name = track.name.toLowerCase();
  const mounts = new Set(
    (snapshot.mounts?.types ?? []).map((t) => t.toLowerCase()),
  );
  if (name.includes("gliding") || name.includes("updraft")) return 12;
  if (name.includes("raptor") && !mounts.has("raptor")) return 14;
  if (name.includes("springer") && !mounts.has("springer")) return 12;
  if (name.includes("skimmer") && !mounts.has("skimmer")) return 10;
  if (name.includes("jackal") && !mounts.has("jackal")) return 14;
  if (name.includes("skyscale") && !mounts.has("skyscale")) return 15;
  if (name.includes("skiff") && !(snapshot.skiffs?.length)) return 10;
  if (name.includes("jade") && !(snapshot.jadebots?.length)) return 8;
  if (name.includes("fractal")) return 6;
  return 0;
}

export function rankMasterySteps(
  snapshot: AccountSnapshot,
  options: { limit?: number } = {},
): RankedMasteryStep[] {
  const limit = options.limit ?? 20;
  const tracks = loadMasteries();
  if (!tracks.length) return [];

  const progress = progressMap(snapshot);
  const out: RankedMasteryStep[] = [];

  for (const track of tracks) {
    if (!accountHasMasteryRegion(snapshot, track.region, track.name)) continue;
    if (!track.levels.length) continue;

    const maxUnlocked = progress.has(track.id) ? progress.get(track.id)! : -1;
    const nextLevelIndex = maxUnlocked + 1;
    if (nextLevelIndex >= track.levels.length) continue;

    const next = track.levels[nextLevelIndex];
    const totals = findRegionTotals(snapshot, track.region);
    const canAfford = totals.free >= next.pointCost;
    const levelsLeft = track.levels.length - nextLevelIndex;
    const xpGuide = resolveMasteryXpGuide(track.region);
    const wp = findNearestWaypoint([
      track.requirement,
      next.name,
      track.name,
      ...regionMapHints(track.region),
      ...xpGuide.wpHints,
    ]);

    const boost = utilityBoost(track, snapshot);
    const score = easeScore({
      pointCost: next.pointCost,
      canAfford,
      levelsLeft,
      levelsTotal: track.levels.length,
      utilityBoost: boost,
    });

    out.push({
      trackId: track.id,
      trackName: track.name,
      region: track.region,
      nextLevelIndex,
      nextLevelName: next.name,
      nextIcon: next.icon,
      pointCost: next.pointCost,
      expCost: next.expCost,
      levelsDone: nextLevelIndex,
      levelsTotal: track.levels.length,
      pointsFree: totals.free,
      canAffordPoints: canAfford,
      easeScore: score,
      whyEasy: canAfford
        ? `Você tem ${totals.free} ponto(s) livre(s) nesta região - próximo nível custa ${next.pointCost}.`
        : `Faltam pontos: livre ${totals.free}/${next.pointCost}. Farm insights/achievements da região.`,
      how: canAfford
        ? `Abra Masteries (H) → ${track.name} → desbloqueie "${next.name}". Depois farm XP desta região.`
        : `Consiga ${next.pointCost - totals.free} mastery point(s) nesta região (insights no mapa / achievements), depois desbloqueie "${next.name}".`,
      where: xpGuide.where,
      instruction: next.instruction || track.requirement,
      description: next.description,
      requirement: track.requirement,
      chatLink: wp?.waypoint.chatLink ?? xpGuide.chatLink,
      teleportLabel: wp
        ? `${wp.waypoint.name} - ${wp.waypoint.mapName}`
        : xpGuide.teleportLabel,
      wikiUrl: wikiSearch(track.name),
      xpGuide,
    });
  }

  return out
    .sort((a, b) => {
      if (b.easeScore !== a.easeScore) return b.easeScore - a.easeScore;
      if (a.pointCost !== b.pointCost) return a.pointCost - b.pointCost;
      const leftA = a.levelsTotal - a.levelsDone;
      const leftB = b.levelsTotal - b.levelsDone;
      return leftA - leftB;
    })
    .slice(0, limit);
}

export function masteryRegionSummaries(snapshot: AccountSnapshot): Array<{
  region: string;
  spent: number;
  earned: number;
  free: number;
  tracksOpen: number;
  tracksDone: number;
}> {
  const tracks = loadMasteries();
  const progress = progressMap(snapshot);
  const byRegion = new Map<
    string,
    { spent: number; earned: number; free: number; open: number; done: number }
  >();

  for (const track of tracks) {
    if (!accountHasMasteryRegion(snapshot, track.region, track.name)) continue;
    const totals = findRegionTotals(snapshot, track.region);
    const cur = byRegion.get(track.region) ?? {
      spent: totals.spent,
      earned: totals.earned,
      free: totals.free,
      open: 0,
      done: 0,
    };
    cur.spent = totals.spent;
    cur.earned = totals.earned;
    cur.free = totals.free;
    const maxUnlocked = progress.has(track.id) ? progress.get(track.id)! : -1;
    if (maxUnlocked + 1 >= track.levels.length) cur.done += 1;
    else cur.open += 1;
    byRegion.set(track.region, cur);
  }

  return [...byRegion.entries()].map(([region, v]) => ({
    region,
    spent: v.spent,
    earned: v.earned,
    free: v.free,
    tracksOpen: v.open,
    tracksDone: v.done,
  }));
}
