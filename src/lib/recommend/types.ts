export type RecommendationMode = "pve" | "pvp";

export type RecommendationCategory =
  | "gear"
  | "build"
  | "mastery"
  | "progression"
  | "economy"
  | "unlock"
  | "fractal"
  | "vault"
  | "pvp_rank"
  | "wvw"
  | "consumable";

export interface Recommendation {
  id: string;
  mode: RecommendationMode;
  category: RecommendationCategory;
  title: string;
  why: string;
  how: string;
  character?: string;
  impact: number; // 1-10
  effort: number; // 1-10 (lower = easier)
  score: number;
  priority?: "critical" | "high" | "medium" | "low";
  links?: Array<{ label: string; href: string }>;
  meta?: Record<string, unknown>;
}

/** Score favors high impact; gear/power gets categoryBoost. */
export function scoreRecommendation(
  impact: number,
  effort: number,
  categoryBoost = 1,
): number {
  const safeEffort = Math.max(effort, 0.5);
  return Number((((impact * 12) / safeEffort) * categoryBoost).toFixed(2));
}

export function priorityFromScore(score: number): Recommendation["priority"] {
  if (score >= 40) return "critical";
  if (score >= 25) return "high";
  if (score >= 15) return "medium";
  return "low";
}
