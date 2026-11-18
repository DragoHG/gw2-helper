import type { AccountSnapshot } from "@/lib/gw2/types";

/** Flags oficiais de /v2/account.access (ordem cronológica de conteúdo). */
export const EXPANSION_ORDER = [
  "HeartOfThorns",
  "PathOfFire",
  "EndOfDragons",
  "SecretsOfTheObscure",
  "JanthirWilds",
  "VisionsOfEternity",
] as const;

export type ExpansionId = (typeof EXPANSION_ORDER)[number];

const LABELS: Record<string, string> = {
  GuildWars2: "Guild Wars 2 (base)",
  HeartOfThorns: "Heart of Thorns",
  PathOfFire: "Path of Fire",
  EndOfDragons: "End of Dragons",
  SecretsOfTheObscure: "Secrets of the Obscure",
  JanthirWilds: "Janthir Wilds",
  VisionsOfEternity: "Visions of Eternity",
  PlayForFree: "Play for Free",
};

export interface AccountAccess {
  raw: string[];
  /** Base paga (não é conta só F2P). */
  hasBaseGame: boolean;
  /** Só F2P sem GW2 comprado. */
  isFreeToPlayOnly: boolean;
  /** Expansões efetivas (PoF implica HoT). */
  owned: ExpansionId[];
  /** Expansões conhecidas que a conta NÃO tem. */
  missing: ExpansionId[];
  /** Labels amigáveis só do que importa na UI. */
  displayOwned: string[];
  highestOwned: ExpansionId | null;
  summary: string;
}

function asSet(access: string[] | undefined): Set<string> {
  return new Set(access ?? []);
}

/**
 * PoF (e packs posteriores que incluem PoF) liberam HoT in-game,
 * mas a API muitas vezes NÃO manda a flag HeartOfThorns.
 */
function effectiveOwned(raw: Set<string>): ExpansionId[] {
  const owned = new Set<ExpansionId>();

  for (const id of EXPANSION_ORDER) {
    if (raw.has(id)) owned.add(id);
  }

  // Path of Fire inclui Heart of Thorns
  if (owned.has("PathOfFire") || raw.has("PathOfFire")) {
    owned.add("HeartOfThorns");
    owned.add("PathOfFire");
  }

  // Expansões posteriores costumam incluir o pack anterior no jogo;
  // na API cada flag é listada se comprada. Não inferimos EoD a partir de SotO etc.
  // Só a regra PoF→HoT é oficialmente necessária para recomendações.

  return EXPANSION_ORDER.filter((id) => owned.has(id));
}

export function resolveAccountAccess(
  access: string[] | undefined,
): AccountAccess {
  const raw = access ?? [];
  const set = asSet(raw);
  const hasBaseGame = set.has("GuildWars2");
  const isFreeToPlayOnly = set.has("PlayForFree") && !hasBaseGame;
  const owned = effectiveOwned(set);
  const missing = EXPANSION_ORDER.filter((id) => !owned.includes(id));

  const displayOwned: string[] = [];
  if (hasBaseGame) displayOwned.push(LABELS.GuildWars2);
  else if (isFreeToPlayOnly) displayOwned.push("Conta Play for Free (base limitada)");
  for (const id of owned) displayOwned.push(LABELS[id] ?? id);

  const highestOwned = owned.length ? owned[owned.length - 1] : null;

  let summary: string;
  if (owned.length === 0 && isFreeToPlayOnly) {
    summary = "Conta Play for Free - conteúdo base limitado.";
  } else if (owned.length === 0) {
    summary = "Guild Wars 2 base (sem expansões na API).";
  } else {
    summary = `Base + ${owned.map((id) => LABELS[id] ?? id).join(", ")}.`;
  }

  return {
    raw,
    hasBaseGame,
    isFreeToPlayOnly,
    owned,
    missing,
    displayOwned,
    highestOwned,
    summary,
  };
}

export function accountAccessFromSnapshot(
  snapshot: AccountSnapshot,
): AccountAccess {
  return resolveAccountAccess(snapshot.account.access);
}

export function hasExpansion(
  snapshot: AccountSnapshot,
  expansion: ExpansionId,
): boolean {
  return accountAccessFromSnapshot(snapshot).owned.includes(expansion);
}

export function expansionLabel(id: string): string {
  return LABELS[id] ?? id;
}
