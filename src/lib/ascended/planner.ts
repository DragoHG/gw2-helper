import { findNearestWaypoint } from "@/lib/geo/waypoints";
import { wikiSearch } from "@/lib/wiki";
import { analyzeCharacterSlots } from "@/lib/gw2/gear";
import type { AccountSnapshot, CharacterSnapshot } from "@/lib/gw2/types";

export interface AscendedPlanItem {
  slot: string;
  group: "weapon" | "armor" | "trinket";
  currentName: string;
  currentIcon?: string;
  currentRarity: string;
  bestRoute: "laurel" | "craft" | "trading_post" | "fractals" | "mixed";
  title: string;
  why: string;
  how: string;
  ownedMatScore: number;
  effort: number;
  wikiUrl: string;
  chatLink?: string;
  teleportHint?: string;
}

const MAT_HINTS: Array<{ key: string; weight: number }> = [
  { key: "glob of ectoplasm", weight: 3 },
  { key: "pile of crystalline dust", weight: 2 },
  { key: "ancient bone", weight: 1 },
  { key: "vicious claw", weight: 1 },
  { key: "vicious fang", weight: 1 },
  { key: "armored scale", weight: 1 },
  { key: "elaborate totem", weight: 1 },
  { key: "powerful venom sac", weight: 1 },
  { key: "vial of powerful blood", weight: 1 },
  { key: "thermocatalytic reagent", weight: 2 },
  { key: "spirit shard", weight: 2 },
  { key: "mithrillium", weight: 2 },
  { key: "silk weaving thread", weight: 2 },
  { key: "thick crafting thread", weight: 2 },
  { key: "coiled thread", weight: 2 },
];

function matInventoryScore(snapshot: AccountSnapshot): {
  score: number;
  details: string[];
} {
  let score = 0;
  const details: string[] = [];
  for (const mat of snapshot.materials) {
    const item = snapshot.itemsIndex[mat.id];
    if (!item) continue;
    const name = item.name.toLowerCase();
    for (const hint of MAT_HINTS) {
      if (name.includes(hint.key) && mat.count > 0) {
        score += hint.weight * Math.min(mat.count / 10, 3);
        details.push(`${item.name} x${mat.count}`);
      }
    }
  }
  return { score, details: details.slice(0, 8) };
}

export function planAscendedForCharacter(
  snapshot: AccountSnapshot,
  character: CharacterSnapshot,
): AscendedPlanItem[] {
  const gaps = analyzeCharacterSlots(snapshot, character).filter(
    (s) => s.needsUpgrade,
  );
  const mats = matInventoryScore(snapshot);
  const laurels = snapshot.wallet.find((c) => c.id === 3)?.value ?? 0;
  const fractal = snapshot.account.fractal_level ?? 0;

  const plans: AscendedPlanItem[] = gaps.map((gap) => {
    let bestRoute: AscendedPlanItem["bestRoute"] = "trading_post";
    let how = "Compre a peça Ascended no Trading Post com stats Berserker (power).";
    let effort = 5;
    let ownedMatScore = mats.score;

    if (gap.group === "trinket") {
      if (laurels >= 30 && ["Amulet", "Accessory1", "Accessory2"].includes(gap.slot)) {
        bestRoute = "laurel";
        how =
          "Vá a Lion's Arch → Laurel Merchant → compre Ascended accessory/amulet Berserker. É a rota mais fácil para iniciante.";
        effort = 1;
        ownedMatScore += 5;
      } else if (fractal >= 1 && ["Ring1", "Ring2", "Backpack"].includes(gap.slot)) {
        bestRoute = "fractals";
        how =
          "Entre em Fractals (portal em Lion's Arch, LFG T1). Rings/back Ascended saem dos fractals. Comece na escala 1.";
        effort = 3;
        const wp = findNearestWaypoint(["Lion's Arch", "Fort Marriner"]);
        return finish(gap, bestRoute, how, effort, ownedMatScore, mats, wp);
      } else {
        bestRoute = "laurel";
        how =
          "Guarde Laurels (dailies) e compre no Laurel Merchant, ou use TP se tiver gold.";
        effort = 2;
      }
    } else if (gap.group === "weapon") {
      bestRoute = mats.score >= 4 ? "craft" : "trading_post";
      how =
        bestRoute === "craft"
          ? `Você já tem mats Ascended úteis (${mats.details.slice(0, 3).join(", ") || "ver Materiais"}). Craft no crafting station da cidade (Weaponsmith/Huntsman/Artificer 500) ou compre no TP.`
          : "Prioridade alta de DPS: compre arma Ascended Berserker no TP ou craft se subir crafting 500.";
      effort = bestRoute === "craft" ? 4 : 3;
    } else {
      bestRoute = mats.score >= 5 ? "craft" : "trading_post";
      how =
        "Armadura Ascended: craft (disciplinas 500) ou TP. Faça depois de armas/trinkets se o gold for curto.";
      effort = 5;
    }

    const wp = findNearestWaypoint([
      gap.group === "trinket" ? "Lion's Arch" : character.core.race,
      "Lion's Arch",
      "Hollowed Out Nest",
    ]);
    return finish(gap, bestRoute, how, effort, ownedMatScore, mats, wp);
  });

  return plans.sort((a, b) => a.effort - b.effort || b.ownedMatScore - a.ownedMatScore);
}

function finish(
  gap: {
    slot: string;
    group: AscendedPlanItem["group"];
    name: string;
    rarity: string;
    icon?: string;
  },
  bestRoute: AscendedPlanItem["bestRoute"],
  how: string,
  effort: number,
  ownedMatScore: number,
  mats: { details: string[] },
  wp: ReturnType<typeof findNearestWaypoint>,
): AscendedPlanItem {
  return {
    slot: gap.slot,
    group: gap.group,
    currentName: gap.name,
    currentIcon: gap.icon,
    currentRarity: gap.rarity,
    bestRoute,
    title: `${gap.slot}: subir para Ascended`,
    why: `Hoje está ${gap.rarity} (${gap.name}). Ascended é o patamar de poder PvE padrão; Exotic já serve, mas Ascended é o salto certo.`,
    how,
    ownedMatScore,
    effort,
    wikiUrl: wikiSearch(`Ascended ${gap.group}`),
    chatLink: wp?.waypoint.chatLink,
    teleportHint: wp
      ? `${wp.waypoint.name} (${wp.waypoint.mapName}) - ${wp.reason}`
      : undefined,
  };
}
