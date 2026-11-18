import { loadEventSchedule } from "@/lib/catalog/store";
import {
  accountAccessFromSnapshot,
  type AccountAccess,
} from "@/lib/gw2/access";
import type { AccountSnapshot } from "@/lib/gw2/types";
import { extractProgressGoals } from "@/lib/events/goals";
import { allOccurrences } from "@/lib/events/schedule";
import { scoreOccurrence } from "@/lib/events/score";
import type {
  EventTimeline,
  ProgressGoal,
  ScoredOccurrence,
} from "@/lib/events/types";

const DISCLAIMER =
  "Horários são agendados (UTC→local). O mapa pode atrasar, falhar ou já ter terminado - não é feed ao vivo da ArenaNet.";

export function buildEventTimeline(
  snapshot: AccountSnapshot,
  options: { now?: number; horizonHours?: number } = {},
): EventTimeline {
  const now = options.now ?? Date.now();
  const horizonHours = options.horizonHours ?? 8;
  const access = accountAccessFromSnapshot(snapshot);
  const goals = extractProgressGoals(snapshot);
  const doneWb = new Set(
    (snapshot.worldBosses ?? []).map((id) => id.toLowerCase()),
  );

  const schedule = loadEventSchedule();
  const occurrences = allOccurrences(now, horizonHours, schedule);

  const scored: ScoredOccurrence[] = [];
  for (const occ of occurrences) {
    const row = scoreOccurrence(occ, goals, access, doneWb, now);
    if (row) scored.push(row);
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.startAt - b.startAt;
  });

  const primary = pickPrimary(scored, goals, now);
  const bridges = pickBridges(scored, primary, now);
  const upcoming = scored
    .filter(
      (s) =>
        s.eventId !== primary?.eventId || s.startAt !== primary?.startAt,
    )
    .filter(
      (s) =>
        !bridges.some(
          (b) => b.eventId === s.eventId && b.startAt === s.startAt,
        ),
    )
    .slice(0, 24)
    .map((s) => ({ ...s, role: "upcoming" as const }));

  if (primary) primary.role = "primary";
  for (const b of bridges) b.role = "bridge";

  return {
    now,
    horizonHours,
    primary,
    bridges,
    upcoming,
    disclaimer: DISCLAIMER,
  };
}

function pickPrimary(
  scored: ScoredOccurrence[],
  goals: ProgressGoal[],
  now: number,
): ScoredOccurrence | null {
  if (!scored.length) return null;

  // Prefer ocorrências que casam achievement_bit / daily com melhor score
  const priorityKinds = new Set([
    "achievement_bit",
    "world_boss_daily",
    "mount_progress",
    "mastery_progress",
  ]);
  const goalById = new Map(goals.map((g) => [g.id, g]));

  const strong = scored.filter((s) =>
    s.matchedGoalIds.some((id) => {
      const g = goalById.get(id);
      return g && priorityKinds.has(g.kind);
    }),
  );

  const pool = strong.length ? strong : scored;
  // Entre os fortes, o mais cedo com score alto (já ordenado por score)
  const best = pool[0];
  if (!best) return null;
  // Se o melhor score está muito longe, ainda é primary - bridges preenchem
  if (best.endAt < now) return pool.find((s) => s.endAt >= now) ?? best;
  return best;
}

function pickBridges(
  scored: ScoredOccurrence[],
  primary: ScoredOccurrence | null,
  now: number,
): ScoredOccurrence[] {
  const until = primary?.startAt ?? now + 3 * 60 * 60 * 1000;
  const bridges = scored
    .filter((s) => {
      if (primary && s.eventId === primary.eventId && s.startAt === primary.startAt) {
        return false;
      }
      if (s.startAt > until) return false;
      if (s.score < 8) return false;
      return s.endAt >= now;
    })
    .sort((a, b) => a.startAt - b.startAt)
    .slice(0, 8);

  // Se não há primary, top bridges = melhores próximos
  if (!primary) {
    return scored
      .filter((s) => s.endAt >= now && s.score >= 8)
      .sort((a, b) => a.startAt - b.startAt)
      .slice(0, 8);
  }
  return bridges;
}

/** Resumo curto para home (sem PII extra). */
export function eventTimelineSummary(
  snapshot: AccountSnapshot,
  options?: { now?: number; horizonHours?: number },
) {
  const timeline = buildEventTimeline(snapshot, options);
  return {
    disclaimer: timeline.disclaimer,
    primary: timeline.primary
      ? {
          name: timeline.primary.name,
          groupName: timeline.primary.groupName,
          minutesUntilStart: timeline.primary.minutesUntilStart,
          isActive: timeline.primary.isActive,
          chatLink: timeline.primary.chatLink,
          reasons: timeline.primary.reasons,
          score: timeline.primary.score,
        }
      : null,
    bridgeCount: timeline.bridges.length,
    scheduleLoaded: loadEventSchedule().length > 0,
    access: accountAccessFromSnapshot(snapshot).summary,
  };
}

export type { AccountAccess };
