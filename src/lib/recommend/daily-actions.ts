import { WORLD_BOSS_API_IDS } from "@/lib/catalog/event-aliases";
import type { Recommendation } from "@/lib/recommend/types";
import {
  priorityFromScore,
  scoreRecommendation,
} from "@/lib/recommend/types";
import { withTeleport } from "@/lib/recommend/teleport";
import type { AccountSnapshot } from "@/lib/gw2/types";
import { wikiSearch } from "@/lib/wiki";

function withPriority(rec: Recommendation): Recommendation {
  return { ...rec, priority: priorityFromScore(rec.score) };
}

const WB_ID_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(WORLD_BOSS_API_IDS).map(([name, id]) => [
    id,
    name.replace(/\b\w/g, (c) => c.toUpperCase()),
  ]),
);

// Nomes mais legíveis (override)
Object.assign(WB_ID_TO_NAME, {
  admiral_taidha_covington: "Admiral Taidha Covington",
  svanir_shaman_chief: "Svanir Shaman Chief",
  megadestroyer: "Megadestroyer",
  fire_elemental: "Fire Elemental",
  shatterer: "The Shatterer",
  great_jungle_wurm: "Great Jungle Wurm",
  modniir_ulgoth: "Modniir Ulgoth",
  shadow_behemoth: "Shadow Behemoth",
  claw_of_jormag: "Claw of Jormag",
  inquest_golem_mark_ii: "Golem Mark II",
  tequatl_the_sunless: "Tequatl the Sunless",
  karka_queen: "Karka Queen",
  triple_trouble: "Triple Trouble",
  drakkar: "Drakkar",
});

export function worldBossDisplayName(apiId: string): string {
  return WB_ID_TO_NAME[apiId] ?? apiId.replace(/_/g, " ");
}

/** Map chests / dungeons / raids ainda não feitos → next actions. */
export function analyzeDailyProgress(
  snapshot: AccountSnapshot,
): Recommendation[] {
  try {
    const recs: Recommendation[] = [];
    const doneWb = new Set(
      (snapshot.worldBosses ?? []).map((id) => id.toLowerCase()),
    );
    const missingWb = Object.keys(WB_ID_TO_NAME).filter((id) => !doneWb.has(id));
    if (missingWb.length > 0 && missingWb.length <= 14) {
      const first = worldBossDisplayName(missingWb[0]);
      recs.push(
        withTeleport(
          withPriority({
            id: "pve-wb-remaining",
            mode: "pve",
            category: "progression",
            title: `World bosses hoje: faltam ${missingWb.length}`,
            why: "Cada WB dá loot/bags e progresso de achievements - bom em qualquer estágio.",
            how: `Próximo sugerido: ${first}. Veja a timeline em Eventos para o horário + teleport.`,
            impact: 6,
            effort: 2,
            score: scoreRecommendation(6, 2, 1.05),
            links: [
              { label: "Eventos", href: "/events" },
              { label: "Daily", href: "/daily" },
              { label: "Wiki", href: wikiSearch(first) },
            ],
            meta: {
              missing: missingWb.slice(0, 8).map(worldBossDisplayName),
            },
          }),
          [first, `World Boss ${first}`],
        ),
      );
    }

    const chests = snapshot.mapChests ?? [];
    if (chests.length === 0) {
      recs.push(
        withTeleport(
          withPriority({
            id: "pve-map-chests",
            mode: "pve",
            category: "progression",
            title: "Map chests do dia ainda não feitos",
            why: "Hero's Choice Chests = loot fácil nos mapas de meta (HoT/PoF/EoD se tiver).",
            how: "Complete a meta do mapa e pegue o baú. Veja Eventos para a próxima meta.",
            impact: 5,
            effort: 2,
            score: scoreRecommendation(5, 2, 0.95),
            links: [
              { label: "Eventos", href: "/events" },
              {
                label: "Wiki",
                href: wikiSearch("Map bonus reward"),
              },
            ],
          }),
          ["Lion's Arch"],
        ),
      );
    }

    const dungeons = snapshot.dungeons ?? [];
    if (dungeons.length === 0) {
      recs.push(
        withTeleport(
          withPriority({
            id: "pve-dungeons",
            mode: "pve",
            category: "progression",
            title: "Dungeons do dia: nenhuma path marcada",
            why: "Paths diárias dão gold/tokens - opcional, mas útil se estiver farmando.",
            how: "LFG dungeon path (ex.: Ascalonian Catacombs P1). Não é obrigatório para Ascended.",
            impact: 3,
            effort: 3,
            score: scoreRecommendation(3, 3, 0.7),
            links: [
              { label: "Wiki", href: wikiSearch("Dungeon") },
              { label: "Daily", href: "/daily" },
            ],
          }),
          ["Lion's Arch", "Fort Marriner"],
        ),
      );
    }

    const raids = snapshot.raids ?? [];
    // raids array vazia pode significar "não fez" OU scope ausente - só sugere se account parece endgame-ish
    if (Array.isArray(raids) && raids.length === 0) {
      const fractal = snapshot.account.fractal_level ?? 0;
      if (fractal >= 50) {
        recs.push(
          withPriority({
            id: "pve-raids-weekly",
            mode: "pve",
            category: "progression",
            title: "Raids/strikes da semana",
            why: "Com Fractal 50+ você já aguenta conteúdo organizado - raids dão lendários/mats.",
            how: "LFG wing 1-4 ou strikes. Comece por Spirit Vale / Boneskinner se for novo.",
            impact: 5,
            effort: 5,
            score: scoreRecommendation(5, 5, 0.85),
            links: [
              { label: "Wiki Raids", href: wikiSearch("Raid") },
              { label: "Snow Crows", href: "https://snowcrows.com/" },
            ],
          }),
        );
      }
    }

    return recs;
  } catch {
    return [];
  }
}
