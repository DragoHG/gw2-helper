import fs from "node:fs";
import path from "node:path";
import { getCatalogDir } from "@/lib/db/paths";
import type {
  CatalogMeta,
  CurrencyEntry,
  MapEntry,
  MasteryTrackEntry,
  ObjectiveWaypointEntry,
  ScheduledEventEntry,
  SectorEntry,
  WaypointEntry,
  WvwRankCatalogEntry,
} from "@/lib/catalog/types";
import type { StoryBeatCatalog } from "@/lib/catalog/story-beats";
import type { WvwRankTitle } from "@/lib/wvw/types";

function ensure() {
  fs.mkdirSync(getCatalogDir(), { recursive: true });
}

function readJson<T>(file: string): T | null {
  const p = path.join(getCatalogDir(), file);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch {
    return null;
  }
}

function writeJson(file: string, data: unknown) {
  ensure();
  fs.writeFileSync(
    path.join(getCatalogDir(), file),
    JSON.stringify(data),
    "utf8",
  );
}

export function loadCatalogMeta(): CatalogMeta | null {
  return readJson<CatalogMeta>("meta.json");
}

export function saveCatalogMeta(meta: CatalogMeta) {
  writeJson("meta.json", meta);
}

export function loadWaypoints(): WaypointEntry[] {
  return readJson<WaypointEntry[]>("waypoints.json") ?? [];
}

export function saveWaypoints(waypoints: WaypointEntry[]) {
  writeJson("waypoints.json", waypoints);
}

export function loadSectors(): SectorEntry[] {
  return readJson<SectorEntry[]>("sectors.json") ?? [];
}

export function saveSectors(sectors: SectorEntry[]) {
  writeJson("sectors.json", sectors);
}

export function loadCurrencies(): CurrencyEntry[] {
  return readJson<CurrencyEntry[]>("currencies.json") ?? [];
}

export function saveCurrencies(currencies: CurrencyEntry[]) {
  writeJson("currencies.json", currencies);
}

export function loadMaps(): MapEntry[] {
  return readJson<MapEntry[]>("maps.json") ?? [];
}

export function saveMaps(maps: MapEntry[]) {
  writeJson("maps.json", maps);
}

export function loadObjectiveWaypoints(): ObjectiveWaypointEntry[] {
  return readJson<ObjectiveWaypointEntry[]>("objective-waypoints.json") ?? [];
}

export function saveObjectiveWaypoints(rows: ObjectiveWaypointEntry[]) {
  writeJson("objective-waypoints.json", rows);
}

export function loadEventSchedule(): ScheduledEventEntry[] {
  return readJson<ScheduledEventEntry[]>("events-schedule.json") ?? [];
}

export function saveEventSchedule(events: ScheduledEventEntry[]) {
  writeJson("events-schedule.json", events);
}

export function loadMasteries(): MasteryTrackEntry[] {
  return readJson<MasteryTrackEntry[]>("masteries.json") ?? [];
}

export function saveMasteries(rows: MasteryTrackEntry[]) {
  writeJson("masteries.json", rows);
}

export function loadWvwRanks(): WvwRankTitle[] {
  const rows = readJson<WvwRankCatalogEntry[]>("wvw-ranks.json") ?? [];
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    minRank: r.minRank,
  }));
}

export function saveWvwRanks(rows: WvwRankTitle[]) {
  const payload: WvwRankCatalogEntry[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    minRank: r.minRank,
  }));
  writeJson("wvw-ranks.json", payload);
}

export function loadStoryBeats(): StoryBeatCatalog[] {
  return readJson<StoryBeatCatalog[]>("story-beats.json") ?? [];
}

export function saveStoryBeats(rows: StoryBeatCatalog[]) {
  writeJson("story-beats.json", rows);
}
