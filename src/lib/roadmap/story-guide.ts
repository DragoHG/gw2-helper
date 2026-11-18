import { loadStoryBeats } from "@/lib/catalog/store";
import {
  STORY_BEATS_SEED,
  type StoryBeatCatalog,
} from "@/lib/catalog/story-beats";
import { findNearestWaypoint } from "@/lib/geo/waypoints";
import { hasExpansion, type ExpansionId } from "@/lib/gw2/access";
import { getFocusedCharacter } from "@/lib/gw2/focus";
import type { AccountSnapshot } from "@/lib/gw2/types";
import { resolveAccountStage } from "@/lib/gw2/stage";
import { wikiSearch } from "@/lib/wiki";
import type { RoadmapStep } from "@/lib/roadmap/types";

export interface StoryRelatedAchievement {
  id: number;
  name: string;
  current: number;
  max: number;
  done: boolean;
}

export interface StoryProgressStep extends RoadmapStep {
  expansionId?: ExpansionId;
  expansionLabel: string;
  relatedAchievements: StoryRelatedAchievement[];
  questCountOnFocus: number;
  statusLabel: string;
  /** Conta tem a expansão (ou é core / LW liberada pela base). */
  owned: boolean;
  /** Ordem cronológica no catálogo (0 = personal). */
  order: number;
  /** Capacidade/heurística: capítulo principal parece fechado. */
  likelyComplete?: boolean;
}

const EXPANSION_LABEL: Record<string, string> = {
  HeartOfThorns: "Heart of Thorns",
  PathOfFire: "Path of Fire",
  EndOfDragons: "End of Dragons",
  SecretsOfTheObscure: "Secrets of the Obscure",
  JanthirWilds: "Janthir Wilds",
  VisionsOfEternity: "Visions of Eternity",
};

/** Seed manda a ordem; catálogo em disco preenche campos se existir o mesmo id. */
function allBeats(): StoryBeatCatalog[] {
  const loaded = loadStoryBeats();
  if (!loaded.length) return STORY_BEATS_SEED;
  const byId = new Map(loaded.map((b) => [b.id, b]));
  return STORY_BEATS_SEED.map((seed) => {
    const disk = byId.get(seed.id);
    return disk ? { ...seed, ...disk, id: seed.id } : seed;
  });
}

function beatOwned(
  snapshot: AccountSnapshot,
  beat: StoryBeatCatalog,
): boolean {
  if (beat.requiresExpansion) {
    return hasExpansion(snapshot, beat.requiresExpansion);
  }
  if (beat.expansion) return hasExpansion(snapshot, beat.expansion);
  return true;
}

function relatedAchievementsForBeat(
  snapshot: AccountSnapshot,
  beat: StoryBeatCatalog,
): StoryRelatedAchievement[] {
  const hints = beat.relatedAchievementHints.map((h) => h.toLowerCase());
  if (!hints.length) return [];

  const hits: StoryRelatedAchievement[] = [];
  for (const row of snapshot.achievements ?? []) {
    const def = snapshot.achievementIndex?.[row.id];
    if (!def) continue;
    const blob = `${def.name ?? ""} ${def.requirement ?? ""}`.toLowerCase();
    if (!hints.some((h) => blob.includes(h))) continue;
    const max = Math.max(1, row.max || def.tiers?.at(-1)?.count || 1);
    const current = row.current ?? 0;
    hits.push({
      id: row.id,
      name: def.name || `Achievement ${row.id}`,
      current,
      max,
      done: Boolean(row.done) || current >= max,
    });
  }

  return hits
    .sort((a, b) => {
      const aOpen = a.done ? 0 : 1;
      const bOpen = b.done ? 0 : 1;
      if (aOpen !== bOpen) return bOpen - aOpen;
      return b.current / b.max - a.current / a.max;
    })
    .slice(0, 6);
}

/**
 * API não marca "story done".
 * Sinais: Jackal, ou Raptor+Springer+Skimmer (rota profunda no deserto).
 * Achievements do tema todos feitos reforçam.
 */
function pofStoryLikelyComplete(
  mounts: Set<string>,
  related: StoryRelatedAchievement[],
): boolean {
  const desertMounts = ["raptor", "springer", "skimmer", "jackal"].filter((m) =>
    mounts.has(m),
  );
  const open = related.filter((r) => !r.done);
  if (related.length >= 2 && open.length === 0 && desertMounts.length >= 2) {
    return true;
  }
  if (mounts.has("jackal") && desertMounts.length >= 3) return true;
  // Sem Jackal na API ainda: 3 montarias da rota = PoF bem avançada / story principal
  return desertMounts.length >= 3;
}

/**
 * Linha completa de história: core + LW4 + expansões.
 * As que a conta não tem ficam `owned: false` (bloqueadas na UI).
 */
export function analyzeStoryProgress(
  snapshot: AccountSnapshot,
): StoryProgressStep[] {
  const stage = resolveAccountStage(snapshot);
  const focused = getFocusedCharacter(snapshot);
  const questCountOnFocus = focused?.quests?.length ?? 0;
  const mounts = new Set(
    (snapshot.mounts?.types ?? []).map((m) => m.toLowerCase()),
  );
  const beats = allBeats();
  const out: StoryProgressStep[] = [];

  const pofRelatedPreview = relatedAchievementsForBeat(
    snapshot,
    beats.find((b) => b.id === "story-pof") ??
      STORY_BEATS_SEED.find((b) => b.id === "story-pof")!,
  );
  const pofDone = pofStoryLikelyComplete(mounts, pofRelatedPreview);

  beats.forEach((beat, order) => {
    const owned = beatOwned(snapshot, beat);
    const related = owned ? relatedAchievementsForBeat(snapshot, beat) : [];
    const openRelated = related.filter((r) => !r.done);
    const wp = owned ? findNearestWaypoint(beat.wpHints) : null;

    const isLw4 = beat.id === "story-lws4" || beat.livingWorldSeason === 4;
    const isPof = beat.id === "story-pof";
    const likelyComplete = isPof ? pofDone : false;

    let priority = owned ? 40 + (beats.length - order) : 5 + order;
    if (!owned) {
      priority = 10 - order;
    } else if (
      beat.id === "story-personal" &&
      (stage.stage === "f2p" || stage.stage === "leveling")
    ) {
      priority = 94;
    } else if (isPof && !pofDone && !mounts.has("jackal")) {
      priority = 88;
    } else if (isPof && pofDone) {
      // PoF principal fechada - não competir com LW4 / poder
      priority = 22;
    } else if (isLw4 && owned && pofDone) {
      priority = 91;
    } else if (isLw4 && owned) {
      priority = 68;
    } else if (
      beat.expansion === "SecretsOfTheObscure" &&
      !mounts.has("skyscale")
    ) {
      priority = 86;
    } else if (beat.expansion === "VisionsOfEternity") {
      priority = 80;
    } else if (beat.expansion === "JanthirWilds") {
      priority = 76;
    } else if (beat.expansion === "EndOfDragons") {
      priority = 74;
    } else if (openRelated.length) {
      priority = 72;
    } else if (beat.forCore80 && stage.stage === "core80") {
      priority = 70;
    }

    const expansionLabel = beat.livingWorldSeason
      ? `Living World Season ${beat.livingWorldSeason}`
      : beat.expansion
        ? (EXPANSION_LABEL[beat.expansion] ?? beat.expansion)
        : beat.requiresExpansion
          ? `${EXPANSION_LABEL[beat.requiresExpansion] ?? beat.requiresExpansion} + episódio`
          : "Core / personal story";

    const unlockLine = beat.unlocks.length
      ? `Desbloqueia: ${beat.unlocks.slice(0, 4).join(" - ")}.`
      : "";

    let statusLabel = "Disponível na sua conta";
    let why = `${beat.why} ${unlockLine}`.trim();
    let how = beat.how;

    if (!owned) {
      const need =
        beat.requiresExpansion ?? beat.expansion
          ? EXPANSION_LABEL[
              (beat.requiresExpansion ?? beat.expansion) as string
            ] ?? beat.requiresExpansion ?? beat.expansion
          : "a expansão";
      statusLabel = "Expansão não liberada nesta conta";
      why = `${beat.why} Sua conta ainda não tem ${need} na API.`;
      how = `Compre/ative ${need}, atualize a conta, e este capítulo entra no plano com waypoint e achievements.`;
    } else if (isPof && pofDone) {
      statusLabel = mounts.has("jackal")
        ? "História principal concluída (montarias)"
        : "História avançada - próximo é LW4";
      why = mounts.has("jackal")
        ? "Path of Fire parece fechada na sua conta (montarias do deserto). O próximo capítulo de história é Living World Season 4."
        : "Sua conta já tem Raptor/Springer/Skimmer - a rota PoF está avançada. O próximo capítulo de história é Living World Season 4 (Jackal ainda não aparece na API - pegue quando puder).";
      how =
        "Abra Living World Season 4 (Domain of Istan) no Story Journal. Se o episódio não estiver liberado, compre na Gem Store / Black Lion. Jackal continua útil no deserto se ainda faltar.";
    } else {
      const achLine = openRelated.length
        ? `Há ${openRelated.length} achievement(s) no tema em aberto - feche bits fáceis juntos.`
        : related.length
          ? "Achievements do tema já avançados nesta conta."
          : `No mesmo mapa, combine com metas/achievements (${beat.bundleMaps.slice(0, 2).join(", ") || beat.where}).`;
      const questLine =
        questCountOnFocus > 0
          ? ` Personagem em foco tem ${questCountOnFocus} quest(s) ativas (use o Story Journal no jogo).`
          : "";
      how = `${beat.how} ${achLine}${questLine}`.trim();

      if (openRelated.length) statusLabel = "Em andamento na conta";
      if (isLw4 && pofDone) {
        statusLabel = "Próximo depois de Path of Fire";
        why = `${beat.why} Com a PoF principal feita, este é o próximo passo de história na linha cronológica.`;
      } else if (isLw4) {
        statusLabel = "Disponível com Path of Fire";
      }
      if (
        (isPof && !mounts.has("jackal")) ||
        (beat.expansion === "SecretsOfTheObscure" && !mounts.has("skyscale"))
      ) {
        statusLabel = "Prioridade - unlock de montaria";
      }
      if (
        beat.id === "story-personal" &&
        (stage.stage === "f2p" || stage.stage === "leveling")
      ) {
        statusLabel = "Prioridade até o 80";
      }
    }

    out.push({
      id: beat.id,
      lane: "story",
      priority,
      title: beat.title,
      why,
      how,
      where: beat.where,
      chatLink: wp?.waypoint.chatLink,
      teleportLabel: wp
        ? `${wp.waypoint.name} - ${wp.waypoint.mapName}`
        : undefined,
      wikiUrl: wikiSearch(beat.wiki),
      href: "/story",
      hrefLabel: "Ver história",
      bundleWith: owned
        ? [
            ...beat.unlocks.slice(0, 3),
            ...beat.bundleMaps.slice(0, 2).map((m) => `Mapa: ${m}`),
            ...openRelated
              .slice(0, 2)
              .map((a) => `${a.name} (${a.current}/${a.max})`),
          ]
        : [
            `Precisa de: ${expansionLabel}`,
            ...beat.unlocks.slice(0, 2),
          ],
      expansionId: beat.expansion ?? beat.requiresExpansion,
      expansionLabel,
      relatedAchievements: related,
      questCountOnFocus,
      statusLabel,
      owned,
      order,
      likelyComplete,
    });
  });

  return out;
}

/** Passos acionáveis (só capítulos liberados) para roadmap / home / recs. */
export function storyRoadmapSteps(snapshot: AccountSnapshot): RoadmapStep[] {
  return analyzeStoryProgress(snapshot)
    .filter((s) => s.owned && !s.likelyComplete)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 8)
    .map((step) => ({
      id: step.id,
      lane: step.lane,
      priority: step.priority,
      title: step.title,
      why: step.why,
      how: step.how,
      where: step.where,
      chatLink: step.chatLink,
      teleportLabel: step.teleportLabel,
      wikiUrl: step.wikiUrl,
      href: step.href,
      hrefLabel: step.hrefLabel,
      bundleWith: step.bundleWith,
    }));
}
