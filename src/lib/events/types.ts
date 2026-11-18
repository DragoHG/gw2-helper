import type {
  EventExpansionKey,
  EventKind,
} from "@/lib/catalog/types";

export type ProgressGoalKind =
  | "achievement_bit"
  | "world_boss_daily"
  | "mount_progress"
  | "mastery_progress"
  | "generic";

export interface ProgressGoal {
  id: string;
  kind: ProgressGoalKind;
  label: string;
  /** Textos para casar com nome do evento */
  matchKeys: string[];
  weight: number;
  achievementId?: number;
  worldBossApiId?: string;
}

export interface EventOccurrence {
  eventId: string;
  name: string;
  groupName: string;
  category: string;
  kind: EventKind;
  expansion: EventExpansionKey;
  wikiQuery: string;
  chatLink?: string;
  worldBossApiId?: string;
  startAt: number;
  endAt: number;
  minutesUntilStart: number;
  minutesLeft: number;
  isActive: boolean;
}

export interface ScoredOccurrence extends EventOccurrence {
  score: number;
  reasons: string[];
  matchedGoalIds: string[];
  role: "primary" | "bridge" | "upcoming";
}

export interface EventTimeline {
  now: number;
  horizonHours: number;
  primary: ScoredOccurrence | null;
  bridges: ScoredOccurrence[];
  upcoming: ScoredOccurrence[];
  disclaimer: string;
}
