import type { AccountAccess } from "@/lib/gw2/access";
import type { EventExpansionKey } from "@/lib/catalog/types";
import {
  activeFestivals,
  festivalMatchesText,
} from "@/lib/catalog/festivals";
import { eventMatchesGoal } from "@/lib/events/goals";
import type {
  EventOccurrence,
  ProgressGoal,
  ScoredOccurrence,
} from "@/lib/events/types";

function expansionAllowed(
  expansion: EventExpansionKey,
  access: AccountAccess,
): boolean {
  if (expansion === "core" || expansion === "unknown") return true;
  // LW: permitir na timeline (score baixo); filtro fino fica nos achievements
  if (expansion === "living_world") return !access.isFreeToPlayOnly;
  return access.owned.includes(expansion);
}

export function scoreOccurrence(
  occ: EventOccurrence,
  goals: ProgressGoal[],
  access: AccountAccess,
  doneWorldBosses: Set<string>,
  nowMs: number = Date.now(),
): ScoredOccurrence | null {
  if (!expansionAllowed(occ.expansion, access)) return null;

  let score = 0;
  const reasons: string[] = [];
  const matchedGoalIds: string[] = [];

  const festivals = activeFestivals(nowMs);
  const isActiveFestival =
    occ.kind === "festival" ||
    festivals.some((f) =>
      festivalMatchesText(f, occ.name, occ.groupName, occ.category),
    );

  if (occ.kind === "festival" || isActiveFestival) {
    if (festivals.length === 0 && occ.kind === "festival") {
      // Festival fora da janela calendário → não empurrar
      return null;
    }
    if (festivals.some((f) => festivalMatchesText(f, occ.name, occ.groupName))) {
      score += 70;
      reasons.push("Festival sazonal ativo");
    }
  }

  for (const goal of goals) {
    if (!eventMatchesGoal(occ.name, occ.groupName, goal)) continue;

    if (
      goal.kind === "world_boss_daily" &&
      occ.worldBossApiId &&
      doneWorldBosses.has(occ.worldBossApiId)
    ) {
      continue;
    }

    matchedGoalIds.push(goal.id);
    score += goal.weight;
    reasons.push(goal.label);
  }

  if (score === 0 && occ.kind === "world_boss") {
    score += 10;
    reasons.push("World boss disponível (progressão / loot)");
  } else if (score === 0 && occ.kind === "meta") {
    if (access.highestOwned && occ.expansion === access.highestOwned) {
      score += 10;
      reasons.push(`Meta da sua expansão (${occ.expansion})`);
    } else if (
      occ.expansion === "core" ||
      occ.expansion === "HeartOfThorns" ||
      occ.expansion === "PathOfFire"
    ) {
      score += 6;
      reasons.push("Meta open-world útil");
    }
  } else if (score === 0 && occ.kind === "living_world") {
    // Sem goal casado: não empurrar LW genérico (ownership de episódio não está na API)
    return null;
  }

  if (score <= 0) return null;

  score -= Math.min(30, occ.minutesUntilStart / 4);

  if (occ.isActive && occ.minutesLeft >= 5) {
    score += 8;
    reasons.push(`Em andamento (~${occ.minutesLeft} min restantes)`);
  } else if (occ.isActive && occ.minutesLeft < 5) {
    score -= 15;
    reasons.push("Janela quase fechando");
  }

  return {
    ...occ,
    score: Number(score.toFixed(2)),
    reasons: [...new Set(reasons)].slice(0, 4),
    matchedGoalIds,
    role: "upcoming",
  };
}
