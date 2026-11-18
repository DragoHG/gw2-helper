import { rankAchievements } from "@/lib/achievements/analyze";
import { planAscendedForCharacter } from "@/lib/ascended/planner";
import { analyzeCraftPlans } from "@/lib/craft/analyze";
import { buildEventTimeline } from "@/lib/events/timeline";
import { findNearestWaypoint } from "@/lib/geo/waypoints";
import { accountAccessFromSnapshot } from "@/lib/gw2/access";
import { getFocusedCharacter } from "@/lib/gw2/focus";
import { resolveAccountStage } from "@/lib/gw2/stage";
import type { AccountSnapshot } from "@/lib/gw2/types";
import { planLegendaries } from "@/lib/legendaries/planner";
import {
  accountTouchedLivingWorld,
  matchLivingWorldEpisode,
} from "@/lib/living-world/episodes";
import { inferAchievementExpansion } from "@/lib/achievements/expansion";
import { rankMasterySteps } from "@/lib/masteries/analyze";
import { buildAllRecommendations } from "@/lib/recommend";
import { mapRoadmapSteps } from "@/lib/roadmap/map-guide";
import { storyRoadmapSteps } from "@/lib/roadmap/story-guide";
import type {
  AccountRoadmap,
  RoadmapLane,
  RoadmapSessionBlock,
  RoadmapStep,
} from "@/lib/roadmap/types";
import { buildMapSessions } from "@/lib/sessions/map-session";
import { vaultDailySummary } from "@/lib/vault/parse";
import { resolveVaultObjective } from "@/lib/vault/guide";
import { wikiSearch } from "@/lib/wiki";

const EMPTY_LANES = (): Record<RoadmapLane, RoadmapStep[]> => ({
  now: [],
  session: [],
  power: [],
  mastery: [],
  achievements: [],
  story: [],
  maps: [],
  vault: [],
  craft: [],
  legendaries: [],
  pvp: [],
});

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export function buildAccountRoadmap(snapshot: AccountSnapshot): AccountRoadmap {
  const stage = resolveAccountStage(snapshot);
  const access = accountAccessFromSnapshot(snapshot);
  const focused = getFocusedCharacter(snapshot);
  const steps: RoadmapStep[] = [];
  const lanes = EMPTY_LANES();

  const push = (step: RoadmapStep) => {
    steps.push(step);
    lanes[step.lane].push(step);
  };

  // --- Sessão multiobjetivo (full) ---
  let session: RoadmapSessionBlock | null = null;
  const sessions = safe(
    () => buildMapSessions(snapshot, { limit: 1 }),
    [],
  );
  if (sessions[0]) {
    const s = sessions[0];
    session = {
      mapName: s.mapName,
      why: s.why,
      how: s.how,
      chatLink: s.chatLink,
      teleportLabel: s.teleportLabel,
      wikiUrl: s.wikiUrl,
      objectives: s.objectives.map((o) => o.label),
    };
    push({
      id: `session-${s.mapId}`,
      lane: "session",
      priority: 100,
      title: `Sessão em ${s.mapName}: ${s.objectives.length} objetivos`,
      why: s.why,
      how: s.how,
      where: s.mapName,
      chatLink: s.chatLink,
      teleportLabel: s.teleportLabel,
      wikiUrl: s.wikiUrl,
      href: "/events",
      hrefLabel: "Abrir eventos",
      bundleWith: s.objectives.map((o) => o.label).slice(0, 6),
    });
  }

  // --- Evento primary ---
  const eventTimeline = safe(
    () => buildEventTimeline(snapshot, { horizonHours: 8 }),
    null,
  );
  if (eventTimeline?.primary) {
    const p = eventTimeline.primary;
    push({
      id: `event-${p.eventId}`,
      lane: "now",
      priority: p.isActive ? 98 : 90,
      title: p.isActive
        ? `Evento ao vivo: ${p.name}`
        : `Próximo evento: ${p.name}`,
      why: p.reasons[0] ?? "Casa com o que falta no seu progresso agora.",
      how: p.isActive
        ? "Teleporte, entre no LFG (W) se precisar e fique até o fim."
        : `Começa em ~${p.minutesUntilStart} min - vá com antecedência.`,
      where: p.groupName,
      chatLink: p.chatLink,
      teleportLabel: p.chatLink ? p.name : undefined,
      wikiUrl: wikiSearch(p.wikiQuery || p.name),
      href: "/events",
      hrefLabel: "Timeline completa",
    });
  }

  // --- Vault ---
  const vault = safe(() => vaultDailySummary(snapshot), null);
  if (vault && vault.openTitles.length) {
    const first = vault.openTitles[0];
    const g = resolveVaultObjective(first);
    push({
      id: "vault-daily",
      lane: "vault",
      priority: 88,
      title: `Wizard's Vault hoje (${vault.done}/${vault.total})`,
      why: `Objetivos abertos: ${vault.openTitles.slice(0, 3).join(" · ")}`,
      how: g.how,
      where: g.where,
      chatLink: g.chatLink,
      teleportLabel: g.teleportLabel,
      wikiUrl: g.wikiUrl,
      href: "/vault",
      hrefLabel: "Abrir Vault",
      bundleWith: vault.openTitles.slice(0, 4),
    });
  }

  // --- Recs top (Poder / now) ---
  const recs = safe(() => buildAllRecommendations(snapshot), []);
  for (const rec of recs.filter((r) => r.mode === "pve").slice(0, 6)) {
    const chatLink =
      typeof rec.meta?.chatLink === "string" ? rec.meta.chatLink : undefined;
    const teleportLabel =
      typeof rec.meta?.teleportLabel === "string"
        ? rec.meta.teleportLabel
        : undefined;
    const lane: RoadmapLane =
      rec.category === "mastery"
        ? "mastery"
        : rec.category === "gear" || rec.category === "progression"
          ? "power"
          : "now";
    push({
      id: `rec-${rec.id}`,
      lane,
      priority: Math.min(95, 50 + rec.score / 4),
      title: rec.title,
      why: rec.why,
      how: rec.how,
      chatLink,
      teleportLabel,
      wikiUrl: rec.links?.find((l) => l.href.includes("wiki"))?.href,
      href: rec.links?.find((l) => l.href.startsWith("/"))?.href,
      hrefLabel: rec.links?.find((l) => l.href.startsWith("/"))?.label,
    });
  }

  // --- Ascended ---
  if (stage.showAscended && focused) {
    const plans = safe(
      () => planAscendedForCharacter(snapshot, focused).slice(0, 3),
      [],
    );
    for (const p of plans) {
      push({
        id: `asc-${p.slot}`,
        lane: "power",
        priority: 82,
        title: p.title,
        why: p.why,
        how: p.how,
        chatLink: p.chatLink,
        teleportLabel: p.teleportHint,
        wikiUrl: p.wikiUrl,
        href: "/ascended",
        hrefLabel: "Plano Ascended",
        icon: p.currentIcon,
      });
    }
  }

  // --- Masteries ---
  const mastery = safe(() => rankMasterySteps(snapshot, { limit: 5 }), []);
  for (const m of mastery) {
    push({
      id: `mas-${m.trackId}-${m.nextLevelIndex}`,
      lane: "mastery",
      priority: m.canAffordPoints ? 84 : 70,
      title: `${m.trackName} → ${m.nextLevelName}`,
      why: m.whyEasy,
      how: `${m.how} XP: ${m.xpGuide.how}`,
      where: m.where,
      chatLink: m.chatLink,
      teleportLabel: m.teleportLabel,
      wikiUrl: m.wikiUrl,
      href: "/masteries",
      hrefLabel: "Masteries",
      icon: m.nextIcon,
    });
  }

  // --- Achievements ---
  const ach = safe(
    () =>
      rankAchievements(snapshot, {
        mode: "pve",
        limit: 6,
        minPct: stage.stage === "f2p" || stage.stage === "leveling" ? 0 : 0.05,
        includeZero: true,
      }),
    [],
  );
  for (const a of ach) {
    push({
      id: `ach-${a.id}`,
      lane: "achievements",
      priority: 72 + a.easeScore / 20,
      title: a.name,
      why: a.whyEasy,
      how: a.nextBits[0]
        ? `Próximo passo: ${a.nextBits[0]}. ${a.beginnerTip}`
        : a.beginnerTip,
      where: a.teleportLabel,
      chatLink: a.chatLink,
      teleportLabel: a.teleportLabel,
      wikiUrl: a.wikiUrl,
      href: "/achievements",
      hrefLabel: "Achievements",
      icon: a.icon,
      bundleWith: a.nextBits.slice(0, 3),
    });
  }

  // --- Story + maps ---
  for (const s of safe(() => storyRoadmapSteps(snapshot), [])) push(s);
  for (const m of safe(() => mapRoadmapSteps(snapshot), [])) push(m);

  // --- LW tocada (só se já houver progresso real) ---
  const questIds = snapshot.characters.flatMap((c) => c.quests ?? []);
  const touchedLw = (snapshot.achievements ?? []).some((a) => {
    if (!(a.current && a.current > 0) && !(a.bits && a.bits.length)) return false;
    const def = snapshot.achievementIndex?.[a.id];
    const inferred = inferAchievementExpansion({
      name: def?.name,
      requirement: def?.requirement,
    });
    if (inferred !== "living_world") return false;
    const episode = matchLivingWorldEpisode(def?.name ?? "");
    return accountTouchedLivingWorld({
      hasProgress: true,
      questIds,
      episode,
    });
  });
  if (touchedLw) {
    const la = findNearestWaypoint(["Lion's Arch"]);
    push({
      id: "lw-continue",
      lane: "story",
      priority: 58,
      title: "Continuar Living World já iniciada",
      why: "Sua conta já tocou episódios de Living World - vale retomar em vez de começar do zero.",
      how: "Abra Achievements / Story do episódio que você já progrediu e feche bits fáceis.",
      where: "Depende do episódio - use Achievements e a wiki do capítulo.",
      chatLink: la?.waypoint.chatLink,
      teleportLabel: la
        ? `${la.waypoint.name} - ${la.waypoint.mapName}`
        : undefined,
      wikiUrl: wikiSearch("Living World"),
      href: "/achievements",
      hrefLabel: "Achievements",
    });
  }

  // --- Craft quase pronto ---
  if (stage.showPowerTrack || stage.stage === "endgame") {
    const craft = safe(
      () =>
        analyzeCraftPlans(snapshot, { limit: 8 }).filter(
          (p) => p.canCraft || p.missingCount <= 3,
        ),
      [],
    );
    for (const c of craft.slice(0, 3)) {
      const miss = c.ingredients.find((i) => i.missing > 0);
      push({
        id: `craft-${c.recipeId}`,
        lane: "craft",
        priority: c.canCraft ? 65 : 48,
        title: c.canCraft
          ? `Craftar agora: ${c.outputName}`
          : `Quase craft: ${c.outputName}`,
        why: c.craftVsBuyNote,
        how: c.canCraft
          ? "Vá à estação de crafting e produza o item."
          : miss
            ? `Falta ${miss.name} ×${miss.missing}. ${miss.how ?? "Compre no TP ou farme."}${miss.buyCostMissing ? ` Compra ≈ no TP.` : ""}`
            : c.craftVsBuyNote,
        where: miss?.where ?? c.stationLabel,
        chatLink: miss?.chatLink ?? c.stationChatLink,
        teleportLabel: miss?.teleportLabel ?? c.stationLabel,
        wikiUrl: miss?.wikiUrl ?? wikiSearch(c.outputName),
        href: "/craft",
        hrefLabel: "Crafting",
        icon: c.outputIcon,
      });
    }
  }

  // --- Legendaries ---
  if (stage.showLegendaries) {
    for (const l of safe(() => planLegendaries(snapshot, 3), [])) {
      push({
        id: l.id,
        lane: "legendaries",
        priority: 45,
        title: l.title,
        why: l.why,
        how: l.how,
        chatLink: l.chatLink,
        teleportLabel: l.teleportLabel,
        wikiUrl: l.wikiUrl,
        href: "/legendaries",
        hrefLabel: "Lendários",
      });
    }
  }

  // --- PvP / WvW (até 3: prioriza WvW + sPvP) ---
  const competitive = recs.filter((r) => r.mode === "pvp").slice(0, 8);
  const wvwFirst =
    competitive.find((r) => r.category === "wvw") ?? competitive[0];
  const spvpFirst = competitive.find(
    (r) => r.category !== "wvw" && r.id !== wvwFirst?.id,
  );
  for (const [i, pvpRec] of [wvwFirst, spvpFirst, competitive[2]]
    .filter(Boolean)
    .entries()) {
    if (!pvpRec) continue;
    const isWvw = pvpRec.category === "wvw";
    push({
      id: `pvp-${pvpRec.id}`,
      lane: "pvp",
      priority: isWvw ? 52 - i : 44 - i,
      title: pvpRec.title,
      why: pvpRec.why,
      how: pvpRec.how,
      chatLink:
        typeof pvpRec.meta?.chatLink === "string"
          ? pvpRec.meta.chatLink
          : undefined,
      teleportLabel:
        typeof pvpRec.meta?.teleportLabel === "string"
          ? pvpRec.meta.teleportLabel
          : undefined,
      href: "/pvp",
      hrefLabel: isWvw ? "WvW" : "sPvP",
      wikiUrl: wikiSearch(isWvw ? "World versus World" : "Structured PvP"),
    });
  }

  // Dedup por título; lanes completas (limitadas); timeline priorizada sem apagar faixas
  const seen = new Set<string>();
  const unique = steps
    .sort((a, b) => b.priority - a.priority)
    .filter((s) => {
      const key = s.title.toLowerCase().slice(0, 48);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  for (const lane of Object.keys(lanes) as RoadmapLane[]) {
    lanes[lane] = unique.filter((s) => s.lane === lane).slice(0, 8);
  }

  const reserved = new Set<string>();
  const timeline: RoadmapStep[] = [];
  // Garante 1 representante por faixa ativa (PvP/craft não somem no slice)
  for (const lane of Object.keys(lanes) as RoadmapLane[]) {
    const first = lanes[lane][0];
    if (!first) continue;
    reserved.add(first.id);
    timeline.push(first);
  }
  for (const s of unique) {
    if (timeline.length >= 28) break;
    if (reserved.has(s.id)) continue;
    timeline.push(s);
  }
  timeline.sort((a, b) => b.priority - a.priority);

  return {
    stageLabel: stage.label,
    stageSummary: stage.summary,
    accessSummary: access.summary,
    generatedAt: new Date().toISOString(),
    session,
    timeline,
    lanes,
  };
}
