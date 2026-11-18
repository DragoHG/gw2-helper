import type { AccountSnapshot } from "@/lib/gw2/types";
import { buildPveRecommendations } from "@/lib/recommend/pve";
import { buildPvpRecommendations } from "@/lib/recommend/pvp";
import type { Recommendation } from "@/lib/recommend/types";

export function buildAllRecommendations(
  snapshot: AccountSnapshot,
): Recommendation[] {
  let pve: Recommendation[] = [];
  let pvp: Recommendation[] = [];
  try {
    pve = buildPveRecommendations(snapshot);
  } catch (err) {
    console.error("buildPveRecommendations", err);
  }
  try {
    pvp = buildPvpRecommendations(snapshot);
  } catch (err) {
    console.error("buildPvpRecommendations", err);
  }
  return [...pve, ...pvp].sort((a, b) => b.score - a.score);
}

export type { Recommendation } from "@/lib/recommend/types";
