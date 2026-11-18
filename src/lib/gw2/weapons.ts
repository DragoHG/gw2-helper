const TWO_HANDED = new Set([
  "Greatsword",
  "Hammer",
  "Longbow",
  "Shortbow",
  "Rifle",
  "Staff",
  "Spear",
]);

export function isTwoHandedWeapon(weaponType?: string): boolean {
  if (!weaponType) return false;
  return TWO_HANDED.has(weaponType);
}

export function offhandSlotFor(mainSlot: "WeaponA1" | "WeaponB1"): "WeaponA2" | "WeaponB2" {
  return mainSlot === "WeaponA1" ? "WeaponA2" : "WeaponB2";
}
