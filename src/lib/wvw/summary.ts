import type { AccountSnapshot } from "@/lib/gw2/types";
import { fetchWvwMatchForWorld } from "@/lib/wvw/match";
import { resolveWvwRankTitle } from "@/lib/wvw/ranks";
import type { WvwAccountSummary } from "@/lib/wvw/types";

/** Moedas WvW estáveis na API. */
export const WVW_CURRENCY = {
  badgeOfHonor: 15,
  skirmishTicket: 26,
  warSupplies: 58,
  pvpLeagueTicket: 30,
} as const;

function walletValue(snapshot: AccountSnapshot, id: number): number {
  return snapshot.wallet?.find((c) => c.id === id)?.value ?? 0;
}

export function wvwRankFromSnapshot(snapshot: AccountSnapshot): number {
  return (
    snapshot.account.wvw_rank ??
    snapshot.account.wvw?.rank ??
    0
  );
}

/** Resumo síncrono (sem match ao vivo). */
export function buildWvwSummarySync(
  snapshot: AccountSnapshot,
): Omit<WvwAccountSummary, "match"> & { match: null } {
  const rank = wvwRankFromSnapshot(snapshot);
  const { current, next } = resolveWvwRankTitle(rank);
  return {
    rank,
    rankTitle: current?.title ?? null,
    nextTitle: next?.title ?? null,
    nextTitleAt: next?.minRank ?? null,
    worldId: snapshot.account.world ?? 0,
    worldName: snapshot.worldName ?? null,
    badgeOfHonor: walletValue(snapshot, WVW_CURRENCY.badgeOfHonor),
    skirmishTickets: walletValue(snapshot, WVW_CURRENCY.skirmishTicket),
    warSupplies: walletValue(snapshot, WVW_CURRENCY.warSupplies),
    match: null,
  };
}

/** Resumo completo com match atual (público). */
export async function buildWvwSummary(
  snapshot: AccountSnapshot,
): Promise<WvwAccountSummary> {
  const base = buildWvwSummarySync(snapshot);
  const match = await fetchWvwMatchForWorld(base.worldId);
  return { ...base, match };
}
