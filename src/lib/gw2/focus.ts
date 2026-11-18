import { getSelectedCharacterName } from "@/lib/db";
import { pickPrimaryCharacter } from "@/lib/gw2/gear";
import type { AccountSnapshot, CharacterSnapshot } from "@/lib/gw2/types";

export function getFocusedCharacter(
  snapshot: AccountSnapshot,
): CharacterSnapshot | null {
  const primary = pickPrimaryCharacter(snapshot);
  const selected = getSelectedCharacterName(primary?.core.name ?? null);
  if (!selected) return primary;
  return (
    snapshot.characters.find((c) => c.core.name === selected) ?? primary
  );
}

export function listCharacters(snapshot: AccountSnapshot) {
  const primary = pickPrimaryCharacter(snapshot);
  return [...snapshot.characters]
    .sort((a, b) => b.core.level - a.core.level || b.core.age - a.core.age)
    .map((c) => ({
      name: c.core.name,
      profession: c.core.profession,
      level: c.core.level,
      isMain: c.core.name === primary?.core.name,
    }));
}
