import type { ExpansionId } from "@/lib/gw2/access";
import { hasExpansion } from "@/lib/gw2/access";
import type { AccountSnapshot } from "@/lib/gw2/types";

/** Overrides quando a API marca a região errada (ex.: Skyscale como Desert). */
export function masteryTrackExpansion(
  trackName: string,
  region: string,
): ExpansionId | null {
  const n = trackName.toLowerCase();
  if (n.includes("skyscale")) return "SecretsOfTheObscure";
  if (n.includes("skiff") || n.includes("jade bot") || n.includes("jadebot")) {
    return "EndOfDragons";
  }
  if (n.includes("griffon")) return "PathOfFire"; // LW S4 / PoF era
  if (n.includes("roller beetle")) return "PathOfFire";
  return masteryRegionExpansion(region);
}

/** Região da API `/v2/masteries` → expansão necessária (null = core/Central Tyria). */
export function masteryRegionExpansion(
  region: string,
): ExpansionId | null {
  const r = region.toLowerCase();
  if (
    r.includes("maguuma") ||
    r.includes("heart of thorns") ||
    r === "hot"
  ) {
    return "HeartOfThorns";
  }
  if (r.includes("desert") || r.includes("path of fire") || r === "pof") {
    return "PathOfFire";
  }
  if (
    r.includes("cantha") ||
    r.includes("jade") ||
    r.includes("end of dragons") ||
    r === "eod"
  ) {
    return "EndOfDragons";
  }
  if (
    r.includes("obscure") ||
    r.includes("soto") ||
    r.includes("skywatch") ||
    r.includes("amnytas") ||
    r.includes("inner nayos")
  ) {
    return "SecretsOfTheObscure";
  }
  if (r.includes("janthir") || r === "jw") {
    return "JanthirWilds";
  }
  if (
    r.includes("vision") ||
    r.includes("voe") ||
    r.includes("castora") ||
    r.includes("eternity")
  ) {
    return "VisionsOfEternity";
  }
  // Central Tyria / Fractals / etc. - base game
  return null;
}

export function accountHasMasteryRegion(
  snapshot: AccountSnapshot,
  region: string,
  trackName?: string,
): boolean {
  const exp = trackName
    ? masteryTrackExpansion(trackName, region)
    : masteryRegionExpansion(region);
  if (!exp) return true;
  return hasExpansion(snapshot, exp);
}

/** Normaliza nomes de região entre mastery defs e masteryPoints.totals. */
export function regionKeyAliases(region: string): string[] {
  const r = region.toLowerCase();
  const out = new Set<string>([region, r]);
  if (r.includes("maguuma") || r.includes("heart of thorns")) {
    out.add("Maguuma");
    out.add("Heart of Thorns");
    out.add("HeartOfThorns");
  }
  if (r.includes("desert") || r.includes("path of fire")) {
    out.add("Desert");
    out.add("Path of Fire");
    out.add("PathOfFire");
  }
  if (r.includes("cantha") || r.includes("jade") || r.includes("end of dragons")) {
    out.add("Cantha");
    out.add("Jade Sea");
    out.add("End of Dragons");
    out.add("EndOfDragons");
  }
  if (r.includes("obscure") || r.includes("soto")) {
    out.add("Secrets of the Obscure");
    out.add("SecretsOfTheObscure");
  }
  if (r.includes("janthir")) {
    out.add("Janthir Wilds");
    out.add("JanthirWilds");
  }
  if (r.includes("vision") || r.includes("eternity") || r.includes("castora")) {
    out.add("Visions of Eternity");
    out.add("VisionsOfEternity");
  }
  if (r.includes("tyria") || r.includes("central")) {
    out.add("Tyria");
    out.add("Central Tyria");
  }
  return [...out];
}

export function findRegionTotals(
  snapshot: AccountSnapshot,
  region: string,
): { spent: number; earned: number; free: number } {
  const aliases = new Set(
    regionKeyAliases(region).map((a) => a.toLowerCase()),
  );
  for (const t of snapshot.masteryPoints?.totals ?? []) {
    if (aliases.has(t.region.toLowerCase())) {
      const free = Math.max(0, (t.earned ?? 0) - (t.spent ?? 0));
      return { spent: t.spent ?? 0, earned: t.earned ?? 0, free };
    }
  }
  return { spent: 0, earned: 0, free: 0 };
}

export function regionMapHints(region: string): string[] {
  const r = region.toLowerCase();
  if (r.includes("maguuma") || r.includes("heart of thorns")) {
    return ["Verdant Brink", "Auric Basin", "Tangled Depths", "Dragon's Stand"];
  }
  if (r.includes("desert") || r.includes("path of fire")) {
    return ["Crystal Oasis", "Desert Highlands", "Elon Riverlands", "Domain of Vabbi"];
  }
  if (r.includes("cantha") || r.includes("jade") || r.includes("end of dragons")) {
    return ["Seitung Province", "New Kaineng City", "Dragon's End", "Arborstone"];
  }
  if (r.includes("obscure") || r.includes("soto")) {
    return ["Skywatch Archipelago", "Amnytas", "Inner Nayos"];
  }
  if (r.includes("janthir")) {
    return ["Lowland Shore", "Janthir Syntri", "Mistburned Barrens"];
  }
  if (r.includes("vision") || r.includes("eternity") || r.includes("castora")) {
    return ["Shipwreck Strand", "Starlit Weald", "Castora"];
  }
  if (r.includes("fractal")) {
    return ["Lion's Arch", "Mistlock Observatory"];
  }
  return ["Lion's Arch", "Queensdale", "Wayfarer Foothills"];
}
