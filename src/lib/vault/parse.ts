import type { AccountSnapshot } from "@/lib/gw2/types";

export interface VaultObjective {
  id: number;
  title: string;
  track: string;
  acclaim: number;
  progressCurrent: number;
  progressComplete: number;
  claimed: boolean;
}

export interface VaultTrack {
  key: "daily" | "weekly" | "special";
  label: string;
  metaProgressCurrent: number;
  metaProgressComplete: number;
  metaRewardAstral: number;
  metaRewardItemId?: number;
  metaRewardClaimed: boolean;
  objectives: VaultObjective[];
}

export interface VaultListing {
  id: number;
  itemId: number;
  itemCount: number;
  type: string;
  cost: number;
  purchased: number;
  purchaseLimit: number;
  itemName?: string;
  itemIcon?: string;
}

function asObj(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as Record<string, unknown>;
}

function parseObjectives(raw: unknown): VaultObjective[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const o = asObj(row);
      if (!o) return null;
      return {
        id: Number(o.id) || 0,
        title: String(o.title ?? "Objetivo"),
        track: String(o.track ?? "PvE"),
        acclaim: Number(o.acclaim) || 0,
        progressCurrent: Number(o.progress_current) || 0,
        progressComplete: Number(o.progress_complete) || 0,
        claimed: Boolean(o.claimed),
      } satisfies VaultObjective;
    })
    .filter((x): x is VaultObjective => Boolean(x));
}

function parseTrack(
  key: VaultTrack["key"],
  label: string,
  raw: unknown,
): VaultTrack | null {
  const o = asObj(raw);
  if (!o) return null;
  const objectives = parseObjectives(o.objectives);
  if (!objectives.length && o.meta_progress_complete == null) return null;
  return {
    key,
    label,
    metaProgressCurrent: Number(o.meta_progress_current) || 0,
    metaProgressComplete: Number(o.meta_progress_complete) || 0,
    metaRewardAstral: Number(o.meta_reward_astral) || 0,
    metaRewardItemId:
      o.meta_reward_item_id != null ? Number(o.meta_reward_item_id) : undefined,
    metaRewardClaimed: Boolean(o.meta_reward_claimed),
    objectives,
  };
}

export function parseVaultTracks(snapshot: AccountSnapshot): VaultTrack[] {
  const v = snapshot.wizardsVault ?? {};
  const out: VaultTrack[] = [];
  const daily = parseTrack("daily", "Daily", v.daily);
  const weekly = parseTrack("weekly", "Weekly", v.weekly);
  const special = parseTrack("special", "Special", v.special);
  if (daily) out.push(daily);
  if (weekly) out.push(weekly);
  if (special) out.push(special);
  return out;
}

export function parseVaultListings(snapshot: AccountSnapshot): VaultListing[] {
  const raw = snapshot.wizardsVault?.listings;
  if (!Array.isArray(raw)) return [];
  const out: VaultListing[] = [];
  for (const row of raw) {
    const o = asObj(row);
    if (!o) continue;
    const itemId = Number(o.item_id) || 0;
    out.push({
      id: Number(o.id) || 0,
      itemId,
      itemCount: Number(o.item_count) || 1,
      type: String(o.type ?? "Listing"),
      cost: Number(o.cost) || 0,
      purchased: Number(o.purchased) || 0,
      purchaseLimit: Number(o.purchase_limit) || 0,
      itemName: snapshot.itemsIndex[itemId]?.name,
      itemIcon: snapshot.itemsIndex[itemId]?.icon,
    });
  }
  return out;
}

export function vaultDailySummary(snapshot: AccountSnapshot): {
  done: number;
  total: number;
  openTitles: string[];
  metaCurrent: number;
  metaComplete: number;
  astral: number;
} | null {
  const daily = parseVaultTracks(snapshot).find((t) => t.key === "daily");
  if (!daily) return null;
  const done = daily.objectives.filter(
    (o) => o.claimed || (o.progressComplete > 0 && o.progressCurrent >= o.progressComplete),
  ).length;
  return {
    done,
    total: daily.objectives.length,
    openTitles: daily.objectives
      .filter((o) => !o.claimed)
      .slice(0, 4)
      .map((o) => o.title),
    metaCurrent: daily.metaProgressCurrent,
    metaComplete: daily.metaProgressComplete,
    astral: daily.metaRewardAstral,
  };
}
