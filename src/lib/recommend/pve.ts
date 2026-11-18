import { rankAchievements } from "@/lib/achievements/analyze";
import { getPinnedAchievementIds } from "@/lib/db";
import {
  calculateAgonyResistance,
  recommendedArForFractalLevel,
} from "@/lib/fractals/ar";
import { findNearestWaypoint } from "@/lib/geo/waypoints";
import { hasExpansion } from "@/lib/gw2/access";
import { ELITE_TABLES, allEliteIds } from "@/lib/gw2/elites";
import { getFocusedCharacter } from "@/lib/gw2/focus";
import { resolveAccountStage } from "@/lib/gw2/stage";
import type {
  AccountSnapshot,
  CharacterSnapshot,
  ItemDetails,
} from "@/lib/gw2/types";
import {
  ARMOR_SLOTS,
  RARITY_RANK,
  TRINKET_SLOTS,
} from "@/lib/gw2/types";
import { isTwoHandedWeapon } from "@/lib/gw2/weapons";
import { planLegendaries } from "@/lib/legendaries/planner";
import { analyzeDailyProgress } from "@/lib/recommend/daily-actions";
import { withTeleport } from "@/lib/recommend/teleport";
import {
  Recommendation,
  priorityFromScore,
  scoreRecommendation,
} from "@/lib/recommend/types";
import { analyzeVault } from "@/lib/recommend/vault";
import { rankMasterySteps } from "@/lib/masteries/analyze";
import { storyRoadmapSteps } from "@/lib/roadmap/story-guide";
import { buildMapSessions } from "@/lib/sessions/map-session";
import { wikiSearch } from "@/lib/wiki";
import { activeFestivals } from "@/lib/catalog/festivals";

function itemOf(
  snapshot: AccountSnapshot,
  id: number | undefined,
): ItemDetails | undefined {
  if (!id) return undefined;
  return snapshot.itemsIndex?.[id];
}

function rarityRank(item?: ItemDetails): number {
  if (!item) return -1;
  return RARITY_RANK[item.rarity] ?? -1;
}

function withPriority(rec: Recommendation): Recommendation {
  return { ...rec, priority: priorityFromScore(rec.score) };
}

function usedEliteIds(character: CharacterSnapshot): Set<number> {
  const used = new Set<number>();
  for (const tab of character.buildTabs ?? []) {
    for (const spec of tab.build?.specializations ?? []) {
      if (spec?.id) used.add(spec.id);
    }
  }
  return used;
}

function analyzeCharacterGear(
  snapshot: AccountSnapshot,
  character: CharacterSnapshot,
): Recommendation[] {
  const recs: Recommendation[] = [];
  const bySlot = new Map(
    (character.equipment ?? []).map((eq) => [eq.slot, eq] as const),
  );

  const gaps: Array<{
    slot: string;
    group: "weapon" | "armor" | "trinket";
    rarity: string;
    name: string;
  }> = [];

  const isOffhandCoveredByTwoHander = (offhand: "WeaponA2" | "WeaponB2") => {
    const mainSlot = offhand === "WeaponA2" ? "WeaponA1" : "WeaponB1";
    const main = bySlot.get(mainSlot);
    if (!main) return false;
    const item = itemOf(snapshot, main.id);
    return isTwoHandedWeapon(item?.details?.type);
  };

  const checkSlots = (
    slots: readonly string[],
    group: "weapon" | "armor" | "trinket",
  ) => {
    for (const slot of slots) {
      if (
        (slot === "WeaponA2" || slot === "WeaponB2") &&
        isOffhandCoveredByTwoHander(slot)
      ) {
        continue;
      }

      const eq = bySlot.get(slot);
      if (!eq) {
        gaps.push({ slot, group, rarity: "Missing", name: "(vazio)" });
        continue;
      }
      const item = itemOf(snapshot, eq.id);
      if (rarityRank(item) < RARITY_RANK.Ascended) {
        gaps.push({
          slot,
          group,
          rarity: item?.rarity ?? "Unknown",
          name: item?.name ?? `#${eq.id}`,
        });
      }
    }
  };

  checkSlots(["WeaponA1", "WeaponA2", "WeaponB1", "WeaponB2"], "weapon");
  checkSlots(ARMOR_SLOTS, "armor");
  checkSlots(TRINKET_SLOTS, "trinket");

  const la = findNearestWaypoint(["Lion's Arch"]);

  if (gaps.length === 0) {
    // Stats: flag Ascended sem atributo explícito / fora de Power+Precision+Ferocity
    let missingStats = 0;
    let oddStats = 0;
    const oddNames: string[] = [];
    for (const eq of character.equipment ?? []) {
      const item = itemOf(snapshot, eq.id);
      if (!item || rarityRank(item) < RARITY_RANK.Ascended) continue;
      const isGearSlot =
        ["Weapon", "Armor", "Back"].includes(item.type) ||
        /Amulet|Ring|Accessory|Backpack/.test(eq.slot);
      if (!isGearSlot) continue;
      if (!eq.stats?.id && !item.details?.infix_upgrade) {
        missingStats += 1;
        continue;
      }
      const statName =
        (eq.stats?.id && snapshot.itemStatsIndex?.[eq.stats.id]?.name) || "";
      if (/cleric|magi|minstrel|nomad|settler|giver|apothecary/i.test(statName)) {
        oddStats += 1;
        if (oddNames.length < 3) oddNames.push(`${eq.slot}: ${statName}`);
      }
    }
    if (missingStats > 0 || oddStats > 0) {
      recs.push(
        withPriority({
          id: `pve-stats-${character.core.name}`,
          mode: "pve",
          category: "gear",
          title: `${character.core.name}: conferir atributos Ascended`,
          why:
            oddStats > 0
              ? `Possível set support/heal em slots power: ${oddNames.join("; ")}.`
              : `${missingStats} peça(s) Ascended sem stats claros no sync.`,
          how: "Confira Berserker (ou o set da sua build) no herói. Troque via mystic forge / stat selectable se precisar.",
          character: character.core.name,
          impact: 6,
          effort: 2,
          score: scoreRecommendation(6, 2, 1),
          links: [
            {
              label: `HardStuck ${character.core.profession}`,
              href: `https://hardstuck.gg/gw2/builds/${character.core.profession.toLowerCase()}/`,
            },
          ],
        }),
      );
    }
    return [
      ...recs,
      withPriority({
        id: `pve-gear-ok-${character.core.name}`,
        mode: "pve",
        category: "gear",
        title: `${character.core.name}: full Ascended/Legendary`,
        why: "Slots PvE relevantes já estão Ascended+. Próximo salto: build/stats e lendários de QoL.",
        how: "Valide runas/sigilos na build meta e olhe collections lendárias se quiser o próximo teto.",
        character: character.core.name,
        impact: 3,
        effort: 8,
        score: scoreRecommendation(3, 8, 0.8),
        links: [{ label: "Lendários", href: "/legendaries" }],
      }),
    ];
  }

  const byGroup = {
    weapon: gaps.filter((g) => g.group === "weapon"),
    trinket: gaps.filter((g) => g.group === "trinket"),
    armor: gaps.filter((g) => g.group === "armor"),
  };

  if (byGroup.weapon.length) {
    const effort = byGroup.weapon.length <= 2 ? 3 : 5;
    recs.push(
      withTeleport(
        withPriority({
          id: `pve-weapons-${character.core.name}`,
          mode: "pve",
          category: "gear",
          title: `${character.core.name}: armas Ascended (${byGroup.weapon.length})`,
          why: `${byGroup.weapon.map((g) => `${g.slot}: ${g.name} (${g.rarity})`).join("; ")}. Maior salto de DPS cedo.`,
          how: "Craft Ascended (Weaponsmith/Huntsman/Artificer) ou TP. Priorize o set principal (WeaponA).",
          character: character.core.name,
          impact: 10,
          effort,
          score: scoreRecommendation(10, effort, 1.35),
          meta: { gaps: byGroup.weapon, chatLink: la?.waypoint.chatLink },
          links: [
            {
              label: "Wiki Ascended weapons",
              href: "https://wiki.guildwars2.com/wiki/Ascended_weapon",
            },
            { label: "Plano Ascended", href: "/ascended" },
          ],
        }),
        ["Lion's Arch"],
      ),
    );
  }

  if (byGroup.trinket.length) {
    recs.push(
      withTeleport(
        withPriority({
          id: `pve-trinkets-${character.core.name}`,
          mode: "pve",
          category: "gear",
          title: `${character.core.name}: trinkets Ascended (${byGroup.trinket.length})`,
          why: `Ainda em Exotic/abaixo: ${byGroup.trinket.map((g) => g.slot).join(", ")}.`,
          how: "88+ Laurels → Laurel merchant. Rings/back também vêm de Fractals.",
          character: character.core.name,
          impact: 9,
          effort: 3,
          score: scoreRecommendation(9, 3, 1.3),
          meta: { gaps: byGroup.trinket, chatLink: la?.waypoint.chatLink },
          links: [
            {
              label: "Wiki Ascended trinkets",
              href: "https://wiki.guildwars2.com/wiki/Ascended_trinket",
            },
            { label: "Laurel merchant", href: wikiSearch("Laurel merchant") },
          ],
        }),
        ["Lion's Arch", "Laurel Merchant"],
      ),
    );
  }

  if (byGroup.armor.length) {
    recs.push(
      withTeleport(
        withPriority({
          id: `pve-armor-${character.core.name}`,
          mode: "pve",
          category: "gear",
          title: `${character.core.name}: armadura Ascended (${byGroup.armor.length}/6)`,
          why: `${byGroup.armor.map((g) => g.slot).join(", ")} ainda não Ascended.`,
          how: "Craft ou TP. Se gold curto, faça depois de armas/trinkets.",
          character: character.core.name,
          impact: 8,
          effort: 5,
          score: scoreRecommendation(8, 5, 1.2),
          meta: { gaps: byGroup.armor },
          links: [
            {
              label: "Wiki Ascended armor",
              href: "https://wiki.guildwars2.com/wiki/Ascended_armor",
            },
          ],
        }),
        ["Lion's Arch"],
      ),
    );
  }

  let missingUpgrades = 0;
  for (const eq of character.equipment ?? []) {
    const item = itemOf(snapshot, eq.id);
    if (!item) continue;
    if (!["Weapon", "Armor"].includes(item.type)) continue;
    if ((eq.upgrades?.length ?? 0) === 0) missingUpgrades += 1;
  }
  if (missingUpgrades > 0) {
    const profession = character.core.profession;
    recs.push(
      withPriority({
        id: `pve-upgrades-${character.core.name}`,
        mode: "pve",
        category: "consumable",
        title: `${character.core.name}: runas/sigilos faltando`,
        why: `${missingUpgrades} peça(s) sem upgrade.`,
        how: `Coloque runas/sigilos da build meta de ${profession} (HardStuck/Snow Crows).`,
        character: character.core.name,
        impact: 8,
        effort: 2,
        score: scoreRecommendation(8, 2, 1.1),
        links: [
          {
            label: `HardStuck ${profession}`,
            href: `https://hardstuck.gg/gw2/builds/${profession.toLowerCase()}/`,
          },
        ],
      }),
    );
  }

  return recs;
}

function analyzeEliteSpecs(
  snapshot: AccountSnapshot,
  character: CharacterSnapshot,
): Recommendation[] {
  const recs: Recommendation[] = [];
  const profession = character.core.profession;
  const used = usedEliteIds(character);
  const knownIds = allEliteIds();

  for (const block of ELITE_TABLES) {
    if (!hasExpansion(snapshot, block.expansion)) continue;
    const elite = block.table[profession];
    if (!elite || used.has(elite.id)) continue;
    recs.push(
      withPriority({
        id: `pve-elite-${block.key}-${character.core.name}`,
        mode: "pve",
        category: "build",
        title: `${character.core.name}: elite ${block.label} (${elite.name})`,
        why: `Você tem ${block.label} e ainda não usa ${elite.name} nos build tabs sincronizados.`,
        how: `Desbloqueie com Hero Points e importe uma build power de ${elite.name}.`,
        character: character.core.name,
        impact: block.impact,
        effort: 4,
        score: scoreRecommendation(block.impact, 4, block.boost),
        meta: { elite: elite.name, expansion: block.expansion },
        links: [
          { label: "Snow Crows", href: "https://snowcrows.com/builds" },
          {
            label: `HardStuck ${profession}`,
            href: `https://hardstuck.gg/gw2/builds/${profession.toLowerCase()}/`,
          },
        ],
      }),
    );
  }

  // SotO: sem elite nova - Weaponmaster Training via hero points
  if (
    hasExpansion(snapshot, "SecretsOfTheObscure") &&
    (character.heropoints?.length ?? 0) < 200
  ) {
    recs.push(
      withPriority({
        id: `pve-soto-weaponmaster-${character.core.name}`,
        mode: "pve",
        category: "build",
        title: `${character.core.name}: Weaponmaster / hero points SotO`,
        why: "SotO não adiciona elite nova - libera armas/traits via Weaponmaster Training e hero points.",
        how: "Complete hero challenges em Skywatch/Amnytas e treine Weaponmaster no painel de training.",
        character: character.core.name,
        impact: 5,
        effort: 4,
        score: scoreRecommendation(5, 4, 0.95),
        links: [
          {
            label: "Wiki Weaponmaster",
            href: wikiSearch("Weaponmaster Training"),
          },
        ],
      }),
    );
  }

  if ([...used].some((id) => knownIds.has(id))) {
    recs.push(
      withPriority({
        id: `pve-build-optimize-${character.core.name}`,
        mode: "pve",
        category: "build",
        title: `${character.core.name}: validar build meta`,
        why: "Elite já em uso - o ganho agora é traits/skills/rota + food/utility.",
        how: "Abra HardStuck/Snow Crows, importe a build power da elite e compare.",
        character: character.core.name,
        impact: 6,
        effort: 2,
        score: scoreRecommendation(6, 2, 1.0),
        links: [
          {
            label: `HardStuck ${profession}`,
            href: `https://hardstuck.gg/gw2/builds/${profession.toLowerCase()}/`,
          },
        ],
      }),
    );
  }

  return recs;
}

function analyzeMasteries(snapshot: AccountSnapshot): Recommendation[] {
  const recs: Recommendation[] = [];
  try {
    const steps = rankMasterySteps(snapshot, { limit: 5 });
    for (const step of steps) {
      recs.push(
        withTeleport(
          withPriority({
            id: `pve-mastery-${step.trackId}-${step.nextLevelIndex}`,
            mode: "pve",
            category: "mastery",
            title: `${step.trackName}: ${step.nextLevelName}`,
            why: step.whyEasy,
            how: `${step.how} XP: ${step.xpGuide.how}`,
            impact: step.canAffordPoints ? 8 : 6,
            effort: step.canAffordPoints ? 2 : 4,
            score: scoreRecommendation(
              step.canAffordPoints ? 8 : 6,
              step.canAffordPoints ? 2 : 4,
              1.05,
            ),
            meta: {
              chatLink: step.chatLink,
              teleportLabel: step.teleportLabel,
              region: step.region,
            },
            links: [
              { label: "Masteries", href: "/masteries" },
              { label: "Eventos", href: "/events" },
              { label: "Wiki", href: step.wikiUrl },
            ],
          }),
          [step.teleportLabel, step.where, ...step.xpGuide.wpHints],
        ),
      );
    }
  } catch {
    /* catálogo mastery ausente */
  }

  const mounts = new Set(
    (snapshot.mounts?.types ?? []).map((m) => m.toLowerCase()),
  );

  if (hasExpansion(snapshot, "PathOfFire")) {
    const basicMounts = ["raptor", "springer", "skimmer", "jackal"];
    const missing = basicMounts.filter((m) => !mounts.has(m));
    if (missing.length) {
      recs.push(
        withTeleport(
          withPriority({
            id: "pve-mastery-pof-mounts",
            mode: "pve",
            category: "mastery",
            title: `Mounts PoF faltando: ${missing.join(", ")}`,
            why: "Jackal/Raptor/Springer/Skimmer mudam a velocidade de farm.",
            how: missing.includes("jackal")
              ? "Unlock Jackal na story PoF (Crystal Oasis), depois farm mastery points no deserto."
              : "Siga a story PoF e as collections de mount no deserto.",
            impact: 8,
            effort: 2,
            score: scoreRecommendation(8, 2, 1.1),
            links: [
              { label: "Masteries", href: "/masteries" },
              { label: "Wiki Mounts", href: wikiSearch("Mount") },
            ],
          }),
          missing.includes("jackal")
            ? ["Crystal Oasis", "Temple of Kormir"]
            : ["Crystal Oasis"],
        ),
      );
    }
    for (const advanced of ["griffon", "roller beetle"] as const) {
      if (!mounts.has(advanced)) {
        recs.push(
          withPriority({
            id: `pve-mount-${advanced.replace(/\s/g, "-")}`,
            mode: "pve",
            category: "mastery",
            title: `Mount avançado: ${advanced}`,
            why: "Mounts avançados aceleram open world demais.",
            how: `Veja o collection achievement de ${advanced} na wiki (pode exigir episódio de Living World).`,
            impact: 5,
            effort: 5,
            score: scoreRecommendation(5, 5, 0.85),
            links: [{ label: "Wiki", href: wikiSearch(advanced) }],
          }),
        );
      }
    }
  }

  if (hasExpansion(snapshot, "SecretsOfTheObscure") && !mounts.has("skyscale")) {
    recs.push(
      withTeleport(
        withPriority({
          id: "pve-mastery-soto-skyscale",
          mode: "pve",
          category: "mastery",
          title: "Unlock Skyscale (SotO)",
          why: "Skyscale é o maior salto de mobilidade moderno.",
          how: "Complete a collection/story de Skyscale em Skywatch Archipelago / Amnytas.",
          impact: 8,
          effort: 4,
          score: scoreRecommendation(8, 4, 1.15),
          links: [
            { label: "Masteries", href: "/masteries" },
            { label: "Wiki Skyscale", href: wikiSearch("Skyscale") },
          ],
        }),
        ["Skywatch Archipelago", "Amnytas"],
      ),
    );
  }

  if (hasExpansion(snapshot, "EndOfDragons")) {
    if (Array.isArray(snapshot.skiffs) && snapshot.skiffs.length === 0) {
      recs.push(
        withPriority({
          id: "pve-eod-skiff",
          mode: "pve",
          category: "mastery",
          title: "Unlock Skiff (EoD)",
          why: "Skiff é a montaria aquática de Cantha - abre exploração e farm.",
          how: "Siga a story/hearts de Seitung até liberar o skiff.",
          impact: 6,
          effort: 3,
          score: scoreRecommendation(6, 3, 1),
          links: [{ label: "Wiki Skiff", href: wikiSearch("Skiff") }],
        }),
      );
    }
    if (Array.isArray(snapshot.jadebots) && snapshot.jadebots.length === 0) {
      recs.push(
        withPriority({
          id: "pve-eod-jadebot",
          mode: "pve",
          category: "mastery",
          title: "Unlock Jade Bot (EoD)",
          why: "Jade Bot dá utilidades de mapa e QoL em Cantha.",
          how: "Complete o unlock na story/vendor de New Kaineng / Arborstone.",
          impact: 5,
          effort: 3,
          score: scoreRecommendation(5, 3, 0.95),
          links: [{ label: "Wiki Jade Bot", href: wikiSearch("Jade Bot") }],
        }),
      );
    }
  }

  return recs;
}

function analyzeMapSessions(snapshot: AccountSnapshot): Recommendation[] {
  try {
    const sessions = buildMapSessions(snapshot, {
      limit: 2,
      light: true,
      skipEvents: true,
    });
    return sessions.map((s) =>
      withTeleport(
        withPriority({
          id: `pve-session-${s.mapId}`,
          mode: "pve",
          category: "progression",
          title: `Sessão em ${s.mapName}: ${s.objectives.length} objetivos`,
          why: s.why,
          how: s.how,
          impact: 8,
          effort: 3,
          score: scoreRecommendation(8, 3, s.eventBoost ? 1.15 : 1.05),
          meta: {
            chatLink: s.chatLink,
            teleportLabel: s.teleportLabel,
            objectives: s.objectives.map((o) => o.label),
          },
          links: [
            { label: "Eventos", href: "/events" },
            { label: "Masteries", href: "/masteries" },
            { label: "Wiki do mapa", href: s.wikiUrl },
          ],
        }),
        [s.teleportLabel, s.mapName],
      ),
    );
  } catch {
    return [];
  }
}

function analyzeFractals(
  snapshot: AccountSnapshot,
  stageShow: boolean,
): Recommendation[] {
  if (!stageShow) return [];
  const level = snapshot.account.fractal_level ?? 0;
  const focused = getFocusedCharacter(snapshot);
  const ar = calculateAgonyResistance(snapshot, focused);
  const need = recommendedArForFractalLevel(level);
  const la = findNearestWaypoint(["Lion's Arch", "Mistlock Observatory"]);
  const arNote =
    ar.known && ar.infusionCount > 0
      ? ` AR estimada ~${ar.total} (alvo ~${need}).`
      : ar.infusionCount > 0
        ? " Infusions presentes - confira AR no herói."
        : level >= 50
          ? " Sem infusions detectadas - compre +1 Agony baratas."
          : "";

  const baseMeta = {
    fractalLevel: level,
    ar: ar.total,
    chatLink: la?.waypoint.chatLink,
  };

  if (level < 25) {
    return [
      withTeleport(
        withPriority({
          id: "pve-fractals-t1",
          mode: "pve",
          category: "fractal",
          title: `Fractals T1: subir do nível ${level || 0}`,
          why: "Melhor fonte estável de rings/back Ascended + ouro diário.",
          how: `LFG T1 (1-25). Portal em Lion's Arch → Mistlock.${arNote}`,
          impact: 8,
          effort: 3,
          score: scoreRecommendation(8, 3, 1.15),
          links: [{ label: "Discretize", href: "https://discretize.eu/" }],
          meta: baseMeta,
        }),
        ["Lion's Arch", "Mistlock Observatory"],
      ),
    ];
  }
  if (level < 50) {
    return [
      withPriority({
        id: "pve-fractals-t2",
        mode: "pve",
        category: "fractal",
        title: `Fractals T2: nível ${level} → 50`,
        why: "T2 melhora rewards e prepara AR para T3.",
        how: `Dailies T1+T2. Compre +1 agony infusions.${arNote}`,
        impact: 7,
        effort: 3,
        score: scoreRecommendation(7, 3, 1.1),
        links: [{ label: "Discretize", href: "https://discretize.eu/" }],
        meta: baseMeta,
      }),
    ];
  }
  if (level < 75) {
    const arGap = ar.known && ar.total < need;
    return [
      withPriority({
        id: "pve-fractals-t3",
        mode: "pve",
        category: "fractal",
        title: arGap
          ? `Fractals T3: AR baixa (~${ar.total}/${need})`
          : `Fractals T3: nível ${level} → 75`,
        why: "T3 exige Agony Resistance; rings/back Ascended e gold sobem.",
        how: `Dailies T1-T3. Fuse/compre infusions até ~${need}+.${arNote}`,
        impact: 6,
        effort: 4,
        score: scoreRecommendation(6, 4, 1.05),
        links: [
          { label: "Wiki AR", href: wikiSearch("Agony Resistance") },
          { label: "Discretize", href: "https://discretize.eu/" },
        ],
        meta: baseMeta,
      }),
    ];
  }
  if (level < 100) {
    return [
      withPriority({
        id: "pve-fractals-t4",
        mode: "pve",
        category: "fractal",
        title: `Fractals T4: nível ${level} → 100`,
        why: "T4 é o teto diário de fractals - melhor gold/mats recorrente.",
        how: `AR confortável (~${need}+). Dailies T4 + recommended.${arNote}`,
        impact: 6,
        effort: 4,
        score: scoreRecommendation(6, 4, 1),
        links: [{ label: "Discretize", href: "https://discretize.eu/" }],
        meta: baseMeta,
      }),
    ];
  }
  return [
    withPriority({
      id: "pve-fractals-cap",
      mode: "pve",
      category: "fractal",
      title: `Fractals no cap (${level})`,
      why: "Personal level ok. Ganho agora: AR, CMs e achievements de fractal.",
      how: `Dailies T4. AR alvo CM ~150+.${arNote}`,
      impact: 4,
      effort: 4,
      score: scoreRecommendation(4, 4, 0.85),
      links: [{ label: "Discretize", href: "https://discretize.eu/" }],
      meta: baseMeta,
    }),
  ];
}

function analyzeEconomy(snapshot: AccountSnapshot): Recommendation[] {
  const goldCopper = snapshot.wallet?.find((c) => c.id === 1)?.value ?? 0;
  const gold = goldCopper / 10000;
  const laurels = snapshot.wallet?.find((c) => c.id === 3)?.value ?? 0;
  const recs: Recommendation[] = [];
  const la = findNearestWaypoint(["Lion's Arch"]);

  if (gold < 30) {
    recs.push(
      withPriority({
        id: "pve-economy-gold",
        mode: "pve",
        category: "economy",
        title: `Gold baixo (~${gold.toFixed(1)}g)`,
        why: "Sem gold fica difícil comprar runas/sigilos e peças Ascended.",
        how: "Wizard's Vault, metas das suas expansões, fractals e venda de mats no TP.",
        impact: 7,
        effort: 3,
        score: scoreRecommendation(7, 3),
        meta: { gold },
        links: [
          { label: "Vault", href: "/vault" },
          { label: "Eventos", href: "/events" },
        ],
      }),
    );
  }

  if (laurels >= 30) {
    recs.push(
      withTeleport(
        withPriority({
          id: "pve-economy-laurels",
          mode: "pve",
          category: "economy",
          title: `Converter ${laurels} Laurels em trinkets Ascended`,
          why: "Laurels → amuleto/acessórios Ascended é o upgrade mais fácil de poder.",
          how: "Lion's Arch → Laurel merchant → Ascended accessories/amulet (Berserker se for power).",
          impact: 9,
          effort: 1,
          score: scoreRecommendation(9, 1, 1.25),
          meta: { laurels, chatLink: la?.waypoint.chatLink },
          links: [
            {
              label: "Laurel merchant",
              href: wikiSearch("Laurel merchant"),
            },
          ],
        }),
        ["Lion's Arch", "Laurel"],
      ),
    );
  }

  return recs;
}

function analyzeLeveling(
  snapshot: AccountSnapshot,
  character: CharacterSnapshot,
): Recommendation[] {
  const access = resolveAccountStage(snapshot).access;
  let how =
    "Complete a história pessoal e hearts nos mapas core até 80. Não gaste gold caro em Ascended antes.";
  if (access.isFreeToPlayOnly) {
    how =
      "Conta F2P: foque personal story + hearts nos mapas liberados. World bosses core dão XP/loot. Expansões depois.";
  } else if (hasExpansion(snapshot, "PathOfFire")) {
    how =
      "Com PoF: história Path of Fire + hearts no deserto é o leveling mais rápido. Evite Ascended caro antes do 80.";
  } else if (hasExpansion(snapshot, "HeartOfThorns")) {
    how =
      "Com HoT: história Heart of Thorns + mapas Maguuma. Hearts core também valem.";
  } else if (hasExpansion(snapshot, "EndOfDragons")) {
    how =
      "Com EoD: história End of Dragons em Cantha sobe rápido. Complete hearts locais.";
  }

  return [
    withTeleport(
      withPriority({
        id: `pve-level-${character.core.name}`,
        mode: "pve",
        category: "progression",
        title: `${character.core.name}: chegar ao 80 (lvl ${character.core.level})`,
        why: "Nível 80 libera Ascended, fractals e elite specs - a base de poder.",
        how,
        character: character.core.name,
        impact: 10,
        effort: 3,
        score: scoreRecommendation(10, 3, 1.25),
        links: [
          {
            label: "Wiki - Leveling",
            href: "https://wiki.guildwars2.com/wiki/Leveling_guide",
          },
          { label: "Eventos", href: "/events" },
        ],
      }),
      access.isFreeToPlayOnly
        ? ["Shadow Behemoth", "Fire Elemental"]
        : hasExpansion(snapshot, "PathOfFire")
          ? ["Crystal Oasis", "Temple of Kormir"]
          : ["Lion's Arch"],
    ),
  ];
}

function analyzeLegendaries(
  snapshot: AccountSnapshot,
  enabled: boolean,
): Recommendation[] {
  if (!enabled) return [];
  try {
    return planLegendaries(snapshot, 3).map((item) =>
      withTeleport(
        withPriority({
          id: `pve-${item.id}`,
          mode: "pve",
          category: "unlock",
          title: item.title,
          why: item.why,
          how: item.how,
          impact: Math.min(7, Math.max(3, Math.round(item.priority / 15))),
          effort: 5,
          score: scoreRecommendation(5, 5, 0.9),
          links: [
            { label: "Wiki", href: item.wikiUrl },
            { label: "Lendários", href: "/legendaries" },
          ],
          meta: { chatLink: item.chatLink },
        }),
        [item.title],
      ),
    );
  } catch {
    return [];
  }
}

function analyzeFestivals(): Recommendation[] {
  try {
    const active = activeFestivals();
    if (!active.length) return [];
    return active.slice(0, 2).map((f) =>
      withTeleport(
        withPriority({
          id: `pve-festival-${f.id}`,
          mode: "pve",
          category: "progression",
          title: `Festival ativo: ${f.name}`,
          why: "Evento sazonal - bags, skins e mats extras enquanto a janela está aberta.",
          how: "Abra Eventos / LFG do festival. Priorize dailies do festival antes do farm normal.",
          impact: 8,
          effort: 2,
          score: scoreRecommendation(8, 2, 1.2),
          links: [
            { label: "Wiki", href: wikiSearch(f.wikiQuery) },
            { label: "Eventos", href: "/events" },
          ],
        }),
        [f.name, "Lion's Arch"],
      ),
    );
  } catch {
    return [];
  }
}

function analyzeMissingScopes(snapshot: AccountSnapshot): Recommendation[] {
  const missing = snapshot.missingScopes ?? [];
  if (!missing.length) return [];
  return [
    withPriority({
      id: "pve-missing-scopes",
      mode: "pve",
      category: "progression",
      title: `API key sem scope: ${missing.join(", ")}`,
      why: "Sem esses scopes o helper não vê inventário/progressão/PvP completo - não é “conta vazia”.",
      how: "Crie nova key em account.arena.net com account, characters, inventories, builds, progression, unlocks, wallet, pvp, tradingpost.",
      impact: 9,
      effort: 1,
      score: scoreRecommendation(9, 1, 1.1),
      links: [
        {
          label: "ArenaNet Applications",
          href: "https://account.arena.net/applications",
        },
      ],
      meta: { missingScopes: missing },
    }),
  ];
}

export function buildPveRecommendations(
  snapshot: AccountSnapshot,
): Recommendation[] {
  const recs: Recommendation[] = [];
  try {
    const stage = resolveAccountStage(snapshot);
    const primary = getFocusedCharacter(snapshot);

    // Vault / festivais / scopes - útil em QUALQUER estágio / key
    recs.push(...analyzeMissingScopes(snapshot));
    recs.push(...analyzeFestivals());
    recs.push(...analyzeVault(snapshot));
    recs.push(...analyzeMapSessions(snapshot));

    // História (unlocks + mapa) - qualquer estágio com beat aplicável
    try {
      const story = storyRoadmapSteps(snapshot)[0];
      if (story) {
        recs.push(
          withTeleport(
            withPriority({
              id: `pve-${story.id}`,
              mode: "pve",
              category: "progression",
              title: story.title,
              why: story.why,
              how: `${story.how} Detalhes na Linha do tempo e Achievements.`,
              impact: stage.stage === "f2p" || stage.stage === "leveling" ? 9 : 6,
              effort: 3,
              score: scoreRecommendation(
                stage.stage === "f2p" || stage.stage === "leveling" ? 9 : 6,
                3,
                1.1,
              ),
              links: [
                { label: "Linha do tempo", href: "/roadmap" },
                { label: "Achievements", href: "/achievements" },
                { label: "Eventos", href: "/events" },
                ...(story.wikiUrl
                  ? [{ label: "Wiki história", href: story.wikiUrl }]
                  : []),
              ],
              meta: {
                chatLink: story.chatLink,
                teleportLabel: story.teleportLabel,
              },
            }),
            [
              story.where,
              ...(story.bundleWith ?? []).map((b) =>
                b.replace(/^Mapa:\s*/i, ""),
              ),
              "Lion's Arch",
            ],
          ),
        );
      }
    } catch {
      /* story opcional */
    }

    if (primary && primary.core.level >= 80) {
      if (stage.showAscended) {
        recs.push(...analyzeCharacterGear(snapshot, primary));
      }
      if (stage.showElites) {
        recs.push(...analyzeEliteSpecs(snapshot, primary));
      }
    } else if (primary) {
      recs.push(...analyzeLeveling(snapshot, primary));
    }

    // Masteries só das expansões que a key realmente tem
    if (stage.stage !== "f2p" && stage.stage !== "leveling") {
      recs.push(...analyzeMasteries(snapshot));
    } else if (
      stage.stage === "leveling" &&
      (hasExpansion(snapshot, "PathOfFire") ||
        hasExpansion(snapshot, "HeartOfThorns"))
    ) {
      // leveling com expansão: mounts/gliding ainda ajudam
      recs.push(...analyzeMasteries(snapshot));
    }

    recs.push(...analyzeFractals(snapshot, stage.showFractals));
    recs.push(...analyzeEconomy(snapshot));
    recs.push(...analyzeDailyProgress(snapshot));
    recs.push(...analyzeLegendaries(snapshot, stage.showLegendaries));

    const easiest = rankAchievements(snapshot, {
      mode: "pve",
      limit: 8,
      minPct: stage.stage === "f2p" || stage.stage === "leveling" ? 0 : 0.1,
      includeZero: true,
    });
    if (easiest.length) {
      const top = easiest[0];
      recs.push(
        withTeleport(
          withPriority({
            id: "pve-achievements-easiest",
            mode: "pve",
            category: "unlock",
            title: `Achievement: ${top.name}`,
            why: `${top.whyEasy} ${top.requirement || ""}`.trim(),
            how: `Hero panel (H) → Achievements. Progresso ${top.current}/${top.max}.${top.nextBits[0] ? ` Próximo: ${top.nextBits[0]}.` : ""}`,
            impact: top.remaining <= 5 ? 7 : 5,
            effort: Math.min(8, Math.max(1, Math.ceil(top.remaining / 3))),
            score: scoreRecommendation(
              top.remaining <= 5 ? 7 : 5,
              Math.min(8, Math.max(1, Math.ceil(top.remaining / 3))),
              1.05,
            ),
            links: [
              { label: "Wiki", href: top.wikiUrl },
              { label: "Achievements", href: "/achievements" },
            ],
            meta: {
              topId: top.id,
              chatLink: top.chatLink,
              easiest: easiest.slice(0, 5).map((a) => ({
                id: a.id,
                name: a.name,
                remaining: a.remaining,
                pct: a.pct,
                easeScore: a.easeScore,
              })),
            },
          }),
          [top.nextBits[0], top.name, top.categoryName],
        ),
      );
    }

    const pinned = getPinnedAchievementIds();
    if (pinned.length) {
      recs.push(
        withPriority({
          id: "pve-achievements-pinned",
          mode: "pve",
          category: "unlock",
          title: `${pinned.length} achievement(s) fixados`,
          why: "Você marcou estes como foco.",
          how: "Abra Achievements → Fixados para teleport/wiki.",
          impact: 6,
          effort: 2,
          score: scoreRecommendation(6, 2, 1.1),
          links: [{ label: "Achievements", href: "/achievements" }],
          meta: { pinned },
        }),
      );
    }
  } catch (err) {
    console.error("buildPveRecommendations failed", err);
  }

  return recs.sort((a, b) => b.score - a.score);
}
