export type WvwTeamColor = "red" | "blue" | "green";

export interface WvwRankTitle {
  id: number;
  title: string;
  minRank: number;
}

export interface WvwMatchSummary {
  matchId: string;
  team: WvwTeamColor | null;
  victoryPoints: Record<WvwTeamColor, number> | null;
  skirmishScores: Record<WvwTeamColor, number> | null;
  linkedWorldNames: string[];
  primaryWorldNames: Record<WvwTeamColor, string>;
}

export interface WvwAccountSummary {
  rank: number;
  rankTitle: string | null;
  nextTitle: string | null;
  nextTitleAt: number | null;
  worldId: number;
  worldName: string | null;
  badgeOfHonor: number;
  skirmishTickets: number;
  warSupplies: number;
  match: WvwMatchSummary | null;
}
