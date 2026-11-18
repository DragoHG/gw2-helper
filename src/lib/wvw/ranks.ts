import { loadWvwRanks, saveWvwRanks } from "@/lib/catalog/store";
import type { WvwRankTitle } from "@/lib/wvw/types";
import { gw2Fetch } from "@/lib/gw2/client";

/** Baixa títulos de rank WvW (público) para o catálogo. */
export async function refreshWvwRanks(): Promise<WvwRankTitle[]> {
  const ids = await gw2Fetch<number[]>("/wvw/ranks");
  const out: WvwRankTitle[] = [];
  const chunk = 50;
  for (let i = 0; i < ids.length; i += chunk) {
    const batch = ids.slice(i, i + chunk);
    const rows = await gw2Fetch<
      Array<{ id: number; title: string; min_rank: number }>
    >("/wvw/ranks", { params: { ids: batch.join(",") } });
    for (const r of rows) {
      out.push({ id: r.id, title: r.title, minRank: r.min_rank });
    }
  }
  out.sort((a, b) => a.minRank - b.minRank);
  saveWvwRanks(out);
  return out;
}

export function resolveWvwRankTitle(rank: number): {
  current: WvwRankTitle | null;
  next: WvwRankTitle | null;
} {
  const ranks = loadWvwRanks();
  if (!ranks.length || rank <= 0) return { current: null, next: ranks[0] ?? null };
  let current: WvwRankTitle | null = null;
  let next: WvwRankTitle | null = null;
  for (const r of ranks) {
    if (r.minRank <= rank) current = r;
    if (r.minRank > rank) {
      next = r;
      break;
    }
  }
  return { current, next };
}
