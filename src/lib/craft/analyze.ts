import { RARITY_RANK } from "@/lib/gw2/types";
import type { AccountSnapshot } from "@/lib/gw2/types";
import { getFocusedCharacter } from "@/lib/gw2/focus";
import { collectOwnedStacks } from "@/lib/inventory/owned";
import { resolveMaterialAction } from "@/lib/materials/guide";
import { findNearestWaypoint } from "@/lib/geo/waypoints";
import { wikiSearch } from "@/lib/wiki";
import type { CraftIngredientNeed, CraftPlanRow } from "@/lib/craft/types";

const SELL_FEE = 0.85; // ~15% listing+tax ao vender no TP

function ratingFor(
  snapshot: AccountSnapshot,
  disciplines: string[],
): number {
  const focused = getFocusedCharacter(snapshot);
  const rows = focused?.crafting ?? [];
  let best = 0;
  for (const d of disciplines) {
    const hit = rows.find(
      (r) => r.discipline.toLowerCase() === d.toLowerCase(),
    );
    if (hit) best = Math.max(best, hit.rating);
  }
  // fallback: melhor rating da conta em qualquer char da disciplina
  if (best === 0) {
    for (const ch of snapshot.characters ?? []) {
      for (const r of ch.crafting ?? []) {
        if (
          disciplines.some(
            (d) => d.toLowerCase() === r.discipline.toLowerCase(),
          )
        ) {
          best = Math.max(best, r.rating);
        }
      }
    }
  }
  return best;
}

function enrichMissing(name: string): Pick<
  CraftIngredientNeed,
  "how" | "where" | "chatLink" | "teleportLabel" | "wikiUrl"
> {
  const action = resolveMaterialAction(name);
  if (action.guide) {
    return {
      how: action.guide.how,
      where: action.guide.where,
      chatLink: action.chatLink,
      teleportLabel: action.teleportLabel,
      wikiUrl: action.wikiUrl,
    };
  }
  return {
    how: "Compre no Trading Post ou farm/salvage open world. Veja a wiki do item.",
    where: "Trading Post em qualquer cidade - Lion's Arch é o hub mais fácil.",
    chatLink: action.chatLink,
    teleportLabel: action.teleportLabel,
    wikiUrl: action.wikiUrl || wikiSearch(name),
  };
}

export function analyzeCraftPlans(
  snapshot: AccountSnapshot,
  options: {
    limit?: number;
    onlyCraftable?: boolean;
    minRarity?: string;
    discipline?: string;
    query?: string;
  } = {},
): CraftPlanRow[] {
  const {
    limit = 80,
    onlyCraftable = false,
    minRarity,
    discipline,
    query,
  } = options;
  const recipes = Object.values(snapshot.recipesIndex ?? {});
  if (!recipes.length) return [];

  const stock = collectOwnedStacks(snapshot);
  const prices = snapshot.commercePrices ?? {};
  const q = query?.trim().toLowerCase();
  const minRank = minRarity ? (RARITY_RANK[minRarity] ?? 0) : 0;
  const station = findNearestWaypoint(["Lion's Arch"]);

  const rows: CraftPlanRow[] = [];

  for (const rec of recipes) {
    if (!rec.disciplines?.length) continue;
    if (
      discipline &&
      !rec.disciplines.some(
        (d) => d.toLowerCase() === discipline.toLowerCase(),
      )
    ) {
      continue;
    }

    const charRating = ratingFor(snapshot, rec.disciplines);
    if (charRating < (rec.min_rating ?? 0)) continue;

    const outItem = snapshot.itemsIndex[rec.output_item_id];
    const outputName = outItem?.name ?? `Item #${rec.output_item_id}`;
    const rarity = outItem?.rarity ?? "Unknown";
    if (minRank > 0 && (RARITY_RANK[rarity] ?? -1) < minRank) continue;
    if (q && !outputName.toLowerCase().includes(q)) continue;

    const ingredients: CraftIngredientNeed[] = (rec.ingredients ?? []).map(
      (ing) => {
        const item = snapshot.itemsIndex[ing.item_id];
        const name = item?.name ?? `Item #${ing.item_id}`;
        const have = stock.get(ing.item_id) ?? 0;
        const need = ing.count;
        const missing = Math.max(0, need - have);
        const buyUnit = prices[ing.item_id]?.buys?.unit_price ?? 0;
        const sellUnit = prices[ing.item_id]?.sells?.unit_price ?? 0;
        const farm = missing > 0 ? enrichMissing(name) : {};
        return {
          itemId: ing.item_id,
          name,
          icon: item?.icon,
          need,
          have,
          missing,
          buyUnit: buyUnit || undefined,
          sellUnit: sellUnit || undefined,
          buyCostMissing: missing > 0 && buyUnit > 0 ? missing * buyUnit : 0,
          ...farm,
        };
      },
    );

    const missingCount = ingredients.reduce((s, i) => s + i.missing, 0);
    const canCraft = missingCount === 0;
    if (onlyCraftable && !canCraft) continue;

    const buyMissingCost = ingredients.reduce(
      (s, i) => s + (i.buyCostMissing ?? 0),
      0,
    );
    const outputSellUnit = prices[rec.output_item_id]?.sells?.unit_price ?? 0;
    const outputBuyUnit = prices[rec.output_item_id]?.buys?.unit_price ?? 0;
    const outputCount = rec.output_item_count || 1;
    const outputSellStack = outputSellUnit * outputCount;

    let craftVsBuy: CraftPlanRow["craftVsBuy"] = "unknown";
    let craftVsBuyNote =
      "Sem preço de compra no TP para comparar craft vs comprar pronto.";
    if (buyMissingCost > 0 && outputBuyUnit > 0) {
      const buyReady = outputBuyUnit * outputCount;
      if (buyMissingCost < buyReady) {
        craftVsBuy = "craft_cheaper";
        craftVsBuyNote = `Craftar (comprando só o que falta) sai mais barato que comprar o item pronto no TP.`;
      } else {
        craftVsBuy = "buy_cheaper";
        craftVsBuyNote = `Comprar o item pronto no TP pode sair mais barato que completar os mats faltantes.`;
      }
    } else if (canCraft && outputSellUnit > 0) {
      craftVsBuyNote = `Você já tem os mats. Venda estimada ~${Math.round(outputSellStack * SELL_FEE)} cobre (após taxa ~15%).`;
    }

    const rarityBoost = (RARITY_RANK[rarity] ?? 0) * 2;
    const easeScore = canCraft
      ? 100 + rarityBoost
      : Math.max(0, 70 - missingCount * 8) + rarityBoost;

    rows.push({
      recipeId: rec.id,
      outputItemId: rec.output_item_id,
      outputName,
      outputIcon: outItem?.icon,
      outputCount,
      outputRarity: rarity,
      disciplines: rec.disciplines,
      minRating: rec.min_rating ?? 0,
      characterRating: charRating,
      canCraft,
      missingCount,
      ingredients,
      buyMissingCost,
      outputSellUnit,
      outputBuyUnit,
      outputSellStack,
      craftVsBuy,
      craftVsBuyNote,
      easeScore,
      chatLink: rec.chat_link,
      stationChatLink: station?.waypoint.chatLink,
      stationLabel: station
        ? `${station.waypoint.name} - crafting stations`
        : "Lion's Arch - crafting stations",
    });
  }

  return rows
    .sort((a, b) => {
      if (a.canCraft !== b.canCraft) return a.canCraft ? -1 : 1;
      if (b.easeScore !== a.easeScore) return b.easeScore - a.easeScore;
      return a.missingCount - b.missingCount;
    })
    .slice(0, limit);
}

/** Mats faltantes mais caros / raros entre os planos analisados. */
export function rarestCraftGaps(
  plans: CraftPlanRow[],
  limit = 15,
): CraftIngredientNeed[] {
  const map = new Map<number, CraftIngredientNeed>();
  for (const p of plans) {
    for (const ing of p.ingredients) {
      if (ing.missing <= 0) continue;
      const prev = map.get(ing.itemId);
      if (!prev) {
        map.set(ing.itemId, { ...ing });
      } else {
        prev.missing = Math.max(prev.missing, ing.missing);
        prev.need = Math.max(prev.need, ing.need);
      }
    }
  }
  return [...map.values()]
    .sort((a, b) => {
      const pa = a.buyUnit ?? a.sellUnit ?? 0;
      const pb = b.buyUnit ?? b.sellUnit ?? 0;
      if (pb !== pa) return pb - pa;
      return a.have - b.have;
    })
    .slice(0, limit);
}
