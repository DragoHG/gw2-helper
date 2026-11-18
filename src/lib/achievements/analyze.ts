import { achievementAllowedForAccount } from "@/lib/achievements/expansion";
import { findNearestWaypoint } from "@/lib/geo/waypoints";
import { wikiPageGuess } from "@/lib/wiki";
import type {
  AccountSnapshot,
  AchievementDefinition,
  AchievementProgress,
} from "@/lib/gw2/types";

export type AchievementMode = "pve" | "pvp" | "wvw" | "any";

export interface RankedAchievement {
  id: number;
  name: string;
  requirement: string;
  description: string;
  current: number;
  max: number;
  remaining: number;
  pct: number;
  easeScore: number;
  mode: AchievementMode;
  categoryName?: string;
  type?: string;
  flags: string[];
  rewardsSummary: string[];
  nextBits: string[];
  wikiUrl: string;
  whyEasy: string;
  beginnerTip: string;
  chatLink?: string;
  teleportLabel?: string;
  teleportReason?: string;
  objectiveWikiUrl?: string;
  icon?: string;
  nextBitIcons?: Array<{ label: string; icon?: string }>;
}

function detectMode(
  flags: string[] = [],
  categoryName?: string,
): AchievementMode {
  if (flags.includes("Pvp")) return "pvp";
  const cat = (categoryName ?? "").toLowerCase();
  if (
    /world vs\.?\s*world|\bwvw\b|edge of the mists|warclaw/.test(cat)
  ) {
    return "wvw";
  }
  if (/^pvp|pvp season|pvp conqueror|legacy pvp|champion series/.test(cat)) {
    return "pvp";
  }
  return "pve";
}

function namedLabel(
  snapshot: AccountSnapshot,
  kind: "Item" | "Skin" | "Mini" | "Title",
  id: number | undefined,
): string {
  if (!id) return kind;
  if (kind === "Item") {
    const item = snapshot.itemsIndex[id];
    if (item?.name) return item.name;
  }
  if (kind === "Skin") {
    const skin = snapshot.skinsIndex?.[id];
    if (skin?.name) return skin.name;
  }
  if (kind === "Mini") {
    const mini = snapshot.minisIndex?.[id];
    if (mini?.name) return mini.name;
  }
  if (kind === "Title") {
    const title = snapshot.titlesIndex?.[id];
    if (title?.name) return `Título: ${title.name}`;
  }
  return `${kind} #${id}`;
}

function rewardsSummary(
  snapshot: AccountSnapshot,
  def?: AchievementDefinition,
): string[] {
  if (!def?.rewards?.length) return [];
  return def.rewards.map((r) => {
    if (r.type === "Coins") return `${Math.round((r.count ?? 0) / 10000)}g`;
    if (r.type === "Item") {
      return `${namedLabel(snapshot, "Item", r.id)} x${r.count ?? 1}`;
    }
    if (r.type === "Title") return namedLabel(snapshot, "Title", r.id);
    if (r.type === "Mastery") return `Mastery ${r.region ?? ""}`.trim();
    return r.type;
  });
}

function nextBitEntries(
  snapshot: AccountSnapshot,
  progress: AchievementProgress,
  def?: AchievementDefinition,
): Array<{ label: string; icon?: string }> {
  if (!def?.bits?.length) return [];
  const done = new Set(progress.bits ?? []);
  const missing: Array<{ label: string; icon?: string }> = [];
  def.bits.forEach((bit, index) => {
    if (done.has(index)) return;
    let label = "";
    let icon: string | undefined;
    if (bit.text) label = bit.text;
    else if (bit.type === "Item") {
      label = namedLabel(snapshot, "Item", bit.id);
      icon = bit.id ? snapshot.itemsIndex?.[bit.id]?.icon : undefined;
    } else if (bit.type === "Skin") {
      label = namedLabel(snapshot, "Skin", bit.id);
      icon = bit.id ? snapshot.skinsIndex?.[bit.id]?.icon : undefined;
    } else if (bit.type === "Minipet") {
      label = namedLabel(snapshot, "Mini", bit.id);
      icon = bit.id ? snapshot.minisIndex?.[bit.id]?.icon : undefined;
    } else label = `${bit.type}${bit.id ? ` #${bit.id}` : ""}`;
    if (label) missing.push({ label, icon });
  });
  return missing.slice(0, 5);
}

function categoryMap(snapshot: AccountSnapshot): Map<number, string> {
  const map = new Map<number, string>();
  for (const cat of snapshot.achievementCategories ?? []) {
    for (const id of cat.achievements ?? []) {
      if (!map.has(id)) map.set(id, cat.name);
    }
  }
  return map;
}

/** Ícone da categoria - fallback quando o achievement não traz icon próprio. */
function categoryIconMap(snapshot: AccountSnapshot): Map<number, string> {
  const map = new Map<number, string>();
  for (const cat of snapshot.achievementCategories ?? []) {
    if (!cat.icon) continue;
    for (const id of cat.achievements ?? []) {
      if (!map.has(id)) map.set(id, cat.icon);
    }
  }
  return map;
}

export function easeScore(current: number, max: number): number {
  if (max <= 0) return 0;
  const remaining = Math.max(max - current, 0);
  const pct = current / max;
  return Number(
    (pct * 100 + 120 / (remaining + 1) + 30 / Math.sqrt(max)).toFixed(2),
  );
}

function attachTeleport(item: RankedAchievement) {
  // Prioridade: próximo bit atual → nome do achievement → requirement → categoria
  const primaryBit = item.nextBits[0];
  const wp = findNearestWaypoint([
    primaryBit,
    item.nextBits[1],
    item.nextBits[2],
    item.name,
    item.requirement,
    item.categoryName,
  ]);
  if (!wp) return;

  item.chatLink = wp.waypoint.chatLink;
  item.teleportLabel = `${wp.waypoint.name} - ${wp.waypoint.mapName}`;
  item.teleportReason = primaryBit
    ? `Para: ${primaryBit} · ${wp.reason}`
    : wp.reason;
  item.objectiveWikiUrl = primaryBit
    ? wikiPageGuess(
        primaryBit.replace(/^World Boss:\s*/i, "").replace(/^Item:\s*/i, ""),
      )
    : wp.wikiUrl;
}

export function rankAchievements(
  snapshot: AccountSnapshot,
  options: {
    mode?: AchievementMode;
    limit?: number;
    minPct?: number;
    includeLocked?: boolean;
    /** Inclui achievements com current=0 (starters). Default: só se minPct===0. */
    includeZero?: boolean;
  } = {},
): RankedAchievement[] {
  const {
    mode = "any",
    limit = 40,
    minPct = 0,
    includeLocked = false,
    includeZero = minPct === 0,
  } = options;

  const cats = categoryMap(snapshot);
  const catIcons = categoryIconMap(snapshot);
  const ranked: RankedAchievement[] = [];

  for (const progress of snapshot.achievements ?? []) {
    if (progress.done) continue;
    if (!includeLocked && progress.unlocked === false) continue;

    const max = progress.max ?? 0;
    const current = progress.current ?? 0;
    if (max <= 0) continue;
    if (current <= 0 && !includeZero) continue;
    if (current <= 0 && minPct > 0) continue;

    const pct = current / max;
    if (current > 0 && pct < minPct) continue;

    const def = snapshot.achievementIndex?.[progress.id];
    const flags = def?.flags ?? [];
    const categoryNameEarly = cats.get(progress.id);
    const detected = detectMode(flags, categoryNameEarly);
    if (mode !== "any" && detected !== mode) continue;
    if (
      flags.includes("Daily") ||
      flags.includes("Weekly") ||
      flags.includes("Monthly")
    ) {
      continue;
    }

    const remaining = max - current;
    // Starters: favorecer max baixo (fáceis de começar)
    const score =
      current <= 0
        ? Number((40 / Math.sqrt(max) + 10 / (remaining + 1)).toFixed(2))
        : easeScore(current, max);
    const name = def?.name ?? `Achievement #${progress.id}`;
    const bitEntries = nextBitEntries(snapshot, progress, def);
    const bits = bitEntries.map((b) => b.label);
    const categoryName = categoryNameEarly;

    // Não sugerir conteúdo de expansão que a conta não tem
    if (!achievementAllowedForAccount(snapshot, def, categoryName, bits)) {
      continue;
    }

    ranked.push({
      id: progress.id,
      name,
      requirement: def?.requirement ?? "",
      description: def?.description ?? "",
      current,
      max,
      remaining,
      pct,
      easeScore: score,
      mode: detected,
      categoryName,
      type: def?.type,
      flags,
      rewardsSummary: rewardsSummary(snapshot, def),
      nextBits: bits,
      wikiUrl: def?.name
        ? `https://wiki.guildwars2.com/wiki/Special:Search/${encodeURIComponent(def.name)}`
        : `https://wiki.guildwars2.com/wiki/Achievement`,
      whyEasy:
        current <= 0
          ? `Ainda não começou · ${max} passos - bom para iniciar agora.`
          : remaining <= 3
            ? `Faltam só ${remaining} - praticamente pronto.`
            : pct >= 0.85
              ? `${Math.round(pct * 100)}% completo; faltam ${remaining}.`
              : `Progresso ${current}/${max} (${Math.round(pct * 100)}%).`,
      beginnerTip:
        "No jogo: tecla H → Achievements. Cole o teleport no chat e clique para abrir o mapa. Se o waypoint estiver fechado, explore perto até liberar.",
      icon: def?.icon || catIcons.get(progress.id),
      nextBitIcons: bitEntries,
    });
  }

  const top = ranked
    .sort((a, b) => {
      if (b.easeScore !== a.easeScore) return b.easeScore - a.easeScore;
      if (a.remaining !== b.remaining) return a.remaining - b.remaining;
      return b.pct - a.pct;
    })
    .slice(0, limit);

  for (const item of top) attachTeleport(item);

  return top;
}

export function achievementSummary(snapshot: AccountSnapshot) {
  const total = snapshot.achievements?.length ?? 0;
  const done = (snapshot.achievements ?? []).filter((a) => a.done).length;
  const inProgress = (snapshot.achievements ?? []).filter(
    (a) => !a.done && (a.current ?? 0) > 0 && (a.max ?? 0) > 0,
  ).length;
  // Preferir quase prontos; se poucos, completar com starters
  let easiest = rankAchievements(snapshot, {
    mode: "pve",
    limit: 5,
    minPct: 0.05,
  });
  if (easiest.length < 3) {
    const starters = rankAchievements(snapshot, {
      mode: "pve",
      limit: 5,
      minPct: 0,
      includeZero: true,
    });
    const seen = new Set(easiest.map((e) => e.id));
    for (const s of starters) {
      if (seen.has(s.id)) continue;
      easiest.push(s);
      if (easiest.length >= 5) break;
    }
  }
  return { total, done, inProgress, easiest };
}
