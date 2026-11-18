import type { AccountSnapshot } from "@/lib/gw2/types";

/** Conta agregada: materials + bank + shared + bags de todos os chars. */
export function countOwned(snapshot: AccountSnapshot, itemId: number): number {
  let n = 0;
  for (const m of snapshot.materials ?? []) {
    if (m.id === itemId) n += m.count;
  }
  for (const slot of snapshot.bank ?? []) {
    if (slot?.id === itemId) n += slot.count;
  }
  for (const slot of snapshot.sharedInventory ?? []) {
    if (slot?.id === itemId) n += slot.count;
  }
  for (const ch of snapshot.characters ?? []) {
    for (const bag of ch.bags ?? []) {
      for (const inv of bag?.inventory ?? []) {
        if (inv?.id === itemId) n += inv.count;
      }
    }
  }
  for (const arm of snapshot.legendaryArmory ?? []) {
    if (arm.id === itemId) n += arm.count;
  }
  return n;
}

export function collectOwnedStacks(
  snapshot: AccountSnapshot,
): Map<number, number> {
  const map = new Map<number, number>();
  const add = (id: number, count: number) => {
    if (!id || count <= 0) return;
    map.set(id, (map.get(id) ?? 0) + count);
  };
  for (const m of snapshot.materials ?? []) add(m.id, m.count);
  for (const slot of snapshot.bank ?? []) {
    if (slot) add(slot.id, slot.count);
  }
  for (const slot of snapshot.sharedInventory ?? []) {
    if (slot) add(slot.id, slot.count);
  }
  for (const ch of snapshot.characters ?? []) {
    for (const bag of ch.bags ?? []) {
      for (const inv of bag?.inventory ?? []) {
        if (inv) add(inv.id, inv.count);
      }
    }
  }
  for (const arm of snapshot.legendaryArmory ?? []) add(arm.id, arm.count);
  return map;
}
