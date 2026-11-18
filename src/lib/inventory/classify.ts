import { guideForItemName } from "@/lib/materials/guide";
import type { AccountSnapshot, ItemDetails } from "@/lib/gw2/types";
import { wikiSearch } from "@/lib/wiki";

export type ItemTier =
  | "needed"
  | "quest"
  | "legendary"
  | "ascended"
  | "junk"
  | "common";

export interface ItemAdvice {
  tier: ItemTier;
  label: string;
  how: string;
  why: string;
  wikiUrl: string;
}

const LEGENDARY_NAME =
  /obsidian shard|gift of |precursor|legendary|mystic clover|bloodstone|glob of ectoplasm/i;

function neededIdsFromSnapshot(snapshot: AccountSnapshot): Set<number> {
  const ids = new Set<number>();
  for (const rec of Object.values(snapshot.recipesIndex ?? {})) {
    for (const ing of rec.ingredients ?? []) {
      if (ing.item_id) ids.add(ing.item_id);
    }
  }
  return ids;
}

/** Classifica item para UI economy/materials - qualquer conta. */
export function classifyItem(
  snapshot: AccountSnapshot,
  itemId: number,
  item?: ItemDetails | null,
): ItemAdvice {
  const name = item?.name ?? `Item #${itemId}`;
  const rarity = item?.rarity ?? "";
  const flags = new Set(item?.flags ?? []);
  const guide = guideForItemName(name);
  const wikiUrl = wikiSearch(guide?.wikiQuery ?? name);
  const needed = neededIdsFromSnapshot(snapshot);

  if (rarity === "Junk") {
    return {
      tier: "junk",
      label: "Lixo",
      why: "Raridade Junk - não serve para craft Ascended/lendário.",
      how: "Venda a um vendor de cidade ou destrua. Não vale Trading Post.",
      wikiUrl,
    };
  }

  if (needed.has(itemId) && guide?.ascendedUse) {
    return {
      tier: "needed",
      label: "Precisa · Ascended/craft",
      why: guide.why,
      how: `${guide.how} Veja Crafting e Ascended para o plano completo.`,
      wikiUrl,
    };
  }

  if (needed.has(itemId)) {
    return {
      tier: "needed",
      label: "Precisa · craft",
      why: "Entra em receita que sua conta já desbloqueou.",
      how: "Guarde para craft. Abra Crafting para ver o que falta e o preço no TP.",
      wikiUrl,
    };
  }

  if (
    LEGENDARY_NAME.test(name) ||
    rarity === "Legendary" ||
    (guide && /lendár|legendary|obsidian/i.test(guide.why + guide.title))
  ) {
    return {
      tier: "legendary",
      label: "Guardar · lendário",
      why: guide?.why ?? "Usado em progressão lendária / gifts.",
      how: guide?.how ?? "Guarde. Veja a página Lendários e a wiki do item.",
      wikiUrl,
    };
  }

  if (guide?.ascendedUse || rarity === "Ascended") {
    return {
      tier: "ascended",
      label: "Guardar · Ascended",
      why: guide?.why ?? "Material / peça ligada a poder Ascended.",
      how: guide?.how ?? "Guarde para craft Ascended. Abra Ascended e Materiais.",
      wikiUrl,
    };
  }

  if (
    flags.has("AccountBound") ||
    flags.has("SoulbindOnAcquire") ||
    flags.has("NoSell")
  ) {
    return {
      tier: "quest",
      label: "Conta / bound",
      why: "Item ligado à conta ou sem venda no TP.",
      how: "Não venda no Trading Post. Verifique se é de collection, story ou unlock.",
      wikiUrl,
    };
  }

  if (rarity === "Rare" || rarity === "Exotic") {
    return {
      tier: "common",
      label: "Salvage / TP",
      why: "Loot rare/exotic - valor em salvage (ecto/dust) ou venda.",
      how: "Salvage com kit Rare/Exotic se precisar de mats Ascended; senão venda no Trading Post.",
      wikiUrl,
    };
  }

  return {
    tier: "common",
    label: "Vender no TP",
    why: "Sem papel claro em Ascended/lendário/craft ativo agora.",
    how: "Pode vender no Trading Post se precisar de gold. Confira Materiais se for stock alto.",
    wikiUrl,
  };
}

export const TIER_ORDER: ItemTier[] = [
  "needed",
  "quest",
  "legendary",
  "ascended",
  "common",
  "junk",
];
