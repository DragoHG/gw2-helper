import type { AccountSnapshot, CharacterSnapshot, ItemDetails } from "@/lib/gw2/types";
import {
  ARMOR_SLOTS,
  RARITY_RANK,
  TRINKET_SLOTS,
  WEAPON_SLOTS,
} from "@/lib/gw2/types";
import { isTwoHandedWeapon } from "@/lib/gw2/weapons";

export interface SlotReport {
  slot: string;
  group: "weapon" | "armor" | "trinket";
  itemId: number | null;
  name: string;
  icon?: string;
  rarity: string;
  rank: number;
  needsUpgrade: boolean;
  upgrades: number;
  note?: string;
}

export function analyzeCharacterSlots(
  snapshot: AccountSnapshot,
  character: CharacterSnapshot,
): SlotReport[] {
  const bySlot = new Map(
    (character.equipment ?? []).map((eq) => [eq.slot, eq] as const),
  );

  const coveredByTwoHander = (slot: string) => {
    if (slot !== "WeaponA2" && slot !== "WeaponB2") return false;
    const main = bySlot.get(slot === "WeaponA2" ? "WeaponA1" : "WeaponB1");
    if (!main) return false;
    const item = snapshot.itemsIndex[main.id];
    return isTwoHandedWeapon(item?.details?.type);
  };

  const build = (
    slots: readonly string[],
    group: SlotReport["group"],
  ): SlotReport[] =>
    slots.map((slot) => {
      if (coveredByTwoHander(slot)) {
        return {
          slot,
          group,
          itemId: null,
          name: "(n/a - arma 2H)",
          rarity: "-",
          rank: RARITY_RANK.Ascended,
          needsUpgrade: false,
          upgrades: 0,
          note: "Offhand não usado com arma de duas mãos",
        };
      }
      const eq = bySlot.get(slot);
      const item: ItemDetails | undefined = eq
        ? snapshot.itemsIndex[eq.id]
        : undefined;
      const rank = item ? (RARITY_RANK[item.rarity] ?? -1) : -1;
      return {
        slot,
        group,
        itemId: eq?.id ?? null,
        name: item?.name ?? (eq ? `#${eq.id}` : "(vazio)"),
        icon: item?.icon,
        rarity: item?.rarity ?? (eq ? "Unknown" : "Missing"),
        rank,
        needsUpgrade: rank < RARITY_RANK.Ascended,
        upgrades: eq?.upgrades?.length ?? 0,
      };
    });

  return [
    ...build(WEAPON_SLOTS, "weapon"),
    ...build(ARMOR_SLOTS, "armor"),
    ...build(TRINKET_SLOTS, "trinket"),
  ];
}

export function pickPrimaryCharacter(snapshot: AccountSnapshot) {
  if (!snapshot.characters.length) return null;
  return [...snapshot.characters].sort((a, b) => {
    const levelDiff = b.core.level - a.core.level;
    if (levelDiff) return levelDiff;
    return b.core.age - a.core.age;
  })[0];
}
