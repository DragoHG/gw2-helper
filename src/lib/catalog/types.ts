export interface CatalogMeta {
  buildId: number;
  refreshedAt: string;
  waypointCount: number;
  sectorCount?: number;
  objectiveCount?: number;
  eventCount?: number;
  scheduleVersion?: string;
  scheduleRefreshedAt?: string;
  currencyCount: number;
  mapCount: number;
  masteryCount?: number;
  wvwRankCount?: number;
  storyBeatCount?: number;
}

/** Título de rank WvW (`/v2/wvw/ranks`). */
export interface WvwRankCatalogEntry {
  id: number;
  title: string;
  minRank: number;
}

export interface MasteryLevelEntry {
  name: string;
  description: string;
  instruction: string;
  icon?: string;
  pointCost: number;
  expCost: number;
}

/** Definição pública de track de mastery (`/v2/masteries`). */
export interface MasteryTrackEntry {
  id: number;
  name: string;
  requirement: string;
  order: number;
  background?: string;
  region: string;
  levels: MasteryLevelEntry[];
}

export type EventKind = "world_boss" | "meta" | "festival" | "living_world" | "other";
export type EventExpansionKey =
  | "core"
  | "living_world"
  | "HeartOfThorns"
  | "PathOfFire"
  | "EndOfDragons"
  | "SecretsOfTheObscure"
  | "JanthirWilds"
  | "VisionsOfEternity"
  | "unknown";

export interface ScheduledEventEntry {
  id: string;
  groupId: string;
  groupName: string;
  category: string;
  name: string;
  kind: EventKind;
  expansion: EventExpansionKey;
  wikiQuery: string;
  chatLink?: string;
  /** ID usado em /account/worldbosses quando aplicável */
  worldBossApiId?: string;
  /** Padrão wiki: minutos por segmento a partir de 00:00 UTC */
  pattern: Array<{ segmentKey: string; durationMinutes: number }>;
  nameKey: string;
}

/** Objetivo do jogo (setor/bit/alias) → waypoint mais próximo. Independente da conta. */
export interface ObjectiveWaypointEntry {
  key: string;
  label: string;
  waypointId: number;
  waypointName: string;
  mapId: number;
  mapName: string;
  chatLink: string;
  wikiQuery: string;
  source: "sector" | "alias" | "achievement-bit";
}

export interface WaypointEntry {
  id: number;
  name: string;
  mapId: number;
  mapName: string;
  chatLink: string;
  coord: [number, number];
  floor: number;
  nameKey: string;
}

/** Setor/área do mapa (bits de explorer e metas usam estes nomes). */
export interface SectorEntry {
  id: number;
  name: string;
  mapId: number;
  mapName: string;
  chatLink?: string;
  coord: [number, number];
  floor: number;
  nameKey: string;
  level?: number;
}

export interface CurrencyEntry {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  order?: number;
}

export interface MapEntry {
  id: number;
  name: string;
  minLevel?: number;
  maxLevel?: number;
  regionName?: string;
}
