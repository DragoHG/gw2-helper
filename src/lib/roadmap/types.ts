export type RoadmapLane =
  | "now"
  | "session"
  | "power"
  | "mastery"
  | "achievements"
  | "story"
  | "maps"
  | "vault"
  | "craft"
  | "legendaries"
  | "pvp";

export interface RoadmapStep {
  id: string;
  lane: RoadmapLane;
  priority: number;
  title: string;
  why: string;
  how: string;
  where?: string;
  chatLink?: string;
  teleportLabel?: string;
  wikiUrl?: string;
  href?: string;
  hrefLabel?: string;
  icon?: string;
  bundleWith?: string[];
}

export interface RoadmapSessionBlock {
  mapName: string;
  why: string;
  how: string;
  chatLink?: string;
  teleportLabel?: string;
  wikiUrl: string;
  objectives: string[];
}

export interface AccountRoadmap {
  stageLabel: string;
  stageSummary: string;
  accessSummary: string;
  generatedAt: string;
  session: RoadmapSessionBlock | null;
  timeline: RoadmapStep[];
  lanes: Record<RoadmapLane, RoadmapStep[]>;
}
