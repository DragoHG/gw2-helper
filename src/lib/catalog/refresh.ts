import { refreshEventSchedule } from "@/lib/catalog/events-schedule";
import { buildObjectiveWaypointIndex } from "@/lib/catalog/objective-index";
import { normalizeCatalogText } from "@/lib/catalog/normalize";
import { gw2Fetch } from "@/lib/gw2/client";
import { STORY_BEATS_SEED } from "@/lib/catalog/story-beats";
import {
  loadCatalogMeta,
  saveCatalogMeta,
  saveCurrencies,
  saveMaps,
  saveMasteries,
  saveSectors,
  saveStoryBeats,
  saveWaypoints,
} from "@/lib/catalog/store";
import { refreshWvwRanks } from "@/lib/wvw/ranks";
import type {
  CurrencyEntry,
  MapEntry,
  MasteryTrackEntry,
  SectorEntry,
  WaypointEntry,
} from "@/lib/catalog/types";

const norm = normalizeCatalogText;

type FloorPayload = {
  regions?: Record<
    string,
    {
      name?: string;
      maps?: Record<
        string,
        {
          name?: string;
          points_of_interest?: Record<
            string,
            {
              name?: string;
              type?: string;
              floor?: number;
              coord?: [number, number];
              id?: number;
              chat_link?: string;
            }
          >;
          sectors?: Record<
            string,
            {
              name?: string;
              level?: number;
              coord?: [number, number];
              id?: number;
              chat_link?: string;
            }
          >;
        }
      >;
    }
  >;
};

function extractFromFloor(
  floorId: number,
  floor: FloorPayload,
): { waypoints: WaypointEntry[]; sectors: SectorEntry[] } {
  const waypoints: WaypointEntry[] = [];
  const sectors: SectorEntry[] = [];

  for (const region of Object.values(floor.regions ?? {})) {
    for (const [mapIdStr, map] of Object.entries(region.maps ?? {})) {
      const mapId = Number(mapIdStr);
      const mapName = map.name ?? `Map ${mapId}`;

      for (const poi of Object.values(map.points_of_interest ?? {})) {
        if (poi.type !== "waypoint" || !poi.id || !poi.chat_link || !poi.name) {
          continue;
        }
        waypoints.push({
          id: poi.id,
          name: poi.name,
          mapId,
          mapName,
          chatLink: poi.chat_link,
          coord: poi.coord ?? [0, 0],
          floor: poi.floor ?? floorId,
          nameKey: norm(poi.name),
        });
      }

      for (const sector of Object.values(map.sectors ?? {})) {
        if (!sector.id || !sector.name || !sector.coord) continue;
        sectors.push({
          id: sector.id,
          name: sector.name,
          mapId,
          mapName,
          chatLink: sector.chat_link,
          coord: sector.coord,
          floor: floorId,
          nameKey: norm(sector.name),
          level: sector.level,
        });
      }
    }
  }

  return { waypoints, sectors };
}

/** Atualiza catálogo estático se o build do jogo mudou (ou force=true). */
export async function refreshCatalog(options: { force?: boolean } = {}): Promise<{
  updated: boolean;
  buildId: number;
  waypointCount: number;
  sectorCount: number;
  objectiveCount: number;
  eventCount: number;
  scheduleVersion?: string;
  masteryCount?: number;
  wvwRankCount?: number;
  storyBeatCount?: number;
  mapCount?: number;
  currencyCount?: number;
  error?: string;
}> {
  try {
    const build = await gw2Fetch<{ id: number }>("/build");
    const meta = loadCatalogMeta();
    const hasSectors = (meta?.sectorCount ?? 0) > 0;
    const hasObjectives = (meta?.objectiveCount ?? 0) > 0;
    const hasEvents = (meta?.eventCount ?? 0) > 0;
    const hasMasteries = (meta?.masteryCount ?? 0) > 0;
    const hasWvwRanks = (meta?.wvwRankCount ?? 0) > 0;
    const hasStory = (meta?.storyBeatCount ?? 0) > 0;
    if (
      !options.force &&
      meta?.buildId === build.id &&
      meta.waypointCount > 0 &&
      hasSectors &&
      hasObjectives &&
      hasEvents &&
      hasMasteries &&
      hasWvwRanks &&
      hasStory
    ) {
      return {
        updated: false,
        buildId: build.id,
        waypointCount: meta.waypointCount,
        sectorCount: meta.sectorCount ?? 0,
        objectiveCount: meta.objectiveCount ?? 0,
        eventCount: meta.eventCount ?? 0,
        scheduleVersion: meta.scheduleVersion,
        masteryCount: meta.masteryCount,
        wvwRankCount: meta.wvwRankCount,
        storyBeatCount: meta.storyBeatCount,
        mapCount: meta.mapCount,
        currencyCount: meta.currencyCount,
      };
    }

    // Só faltava o schedule de eventos - atualiza sem reindexar tudo
    if (
      !options.force &&
      meta?.buildId === build.id &&
      meta.waypointCount > 0 &&
      hasSectors &&
      hasObjectives &&
      !hasEvents
    ) {
      const schedule = await refreshEventSchedule();
      saveCatalogMeta({
        ...meta,
        eventCount: schedule.eventCount,
        scheduleVersion: schedule.scheduleVersion,
        scheduleRefreshedAt: new Date().toISOString(),
      });
      return {
        updated: true,
        buildId: build.id,
        waypointCount: meta.waypointCount,
        sectorCount: meta.sectorCount ?? 0,
        objectiveCount: meta.objectiveCount ?? 0,
        eventCount: schedule.eventCount,
        scheduleVersion: schedule.scheduleVersion,
        masteryCount: meta.masteryCount,
        wvwRankCount: meta.wvwRankCount,
      };
    }

    // Só faltavam títulos WvW
    if (
      !options.force &&
      meta?.buildId === build.id &&
      meta.waypointCount > 0 &&
      hasSectors &&
      hasObjectives &&
      hasEvents &&
      hasMasteries &&
      !hasWvwRanks
    ) {
      const wvwRanks = await refreshWvwRanks();
      saveCatalogMeta({
        ...meta,
        wvwRankCount: wvwRanks.length,
      });
      return {
        updated: true,
        buildId: build.id,
        waypointCount: meta.waypointCount,
        sectorCount: meta.sectorCount ?? 0,
        objectiveCount: meta.objectiveCount ?? 0,
        eventCount: meta.eventCount ?? 0,
        scheduleVersion: meta.scheduleVersion,
        masteryCount: meta.masteryCount,
        wvwRankCount: wvwRanks.length,
        storyBeatCount: meta.storyBeatCount,
      };
    }

    // Só faltava catálogo de história
    if (
      !options.force &&
      meta?.buildId === build.id &&
      meta.waypointCount > 0 &&
      hasSectors &&
      hasObjectives &&
      hasEvents &&
      hasMasteries &&
      hasWvwRanks &&
      !hasStory
    ) {
      saveStoryBeats(STORY_BEATS_SEED);
      saveCatalogMeta({
        ...meta,
        storyBeatCount: STORY_BEATS_SEED.length,
      });
      return {
        updated: true,
        buildId: build.id,
        waypointCount: meta.waypointCount,
        sectorCount: meta.sectorCount ?? 0,
        objectiveCount: meta.objectiveCount ?? 0,
        eventCount: meta.eventCount ?? 0,
        scheduleVersion: meta.scheduleVersion,
        masteryCount: meta.masteryCount,
        wvwRankCount: meta.wvwRankCount,
        storyBeatCount: STORY_BEATS_SEED.length,
      };
    }

    // Floors positivos de Tyria (teto para não explodir o tempo do force)
    let floorsToFetch = [1, 2, 3, 49];
    try {
      const continent = await gw2Fetch<{ floors?: number[] }>("/continents/1");
      const positive = (continent.floors ?? [])
        .filter((f) => f > 0)
        .sort((a, b) => a - b);
      // Prioriza floors densos conhecidos + amostra do restante
      const preferred = new Set([1, 2, 3, 48, 49]);
      const rest = positive.filter((f) => !preferred.has(f)).slice(0, 12);
      floorsToFetch = [...preferred].filter((f) => positive.includes(f) || f <= 49);
      floorsToFetch = [...new Set([...floorsToFetch, ...rest])].sort(
        (a, b) => a - b,
      );
    } catch {
      /* fallback fixo */
    }

    const waypointMap = new Map<number, WaypointEntry>();
    const sectorMap = new Map<number, SectorEntry>();

    for (const floorId of floorsToFetch) {
      try {
        const floor = await gw2Fetch<FloorPayload>(
          `/continents/1/floors/${floorId}`,
        );
        const extracted = extractFromFloor(floorId, floor);
        for (const wp of extracted.waypoints) waypointMap.set(wp.id, wp);
        for (const sec of extracted.sectors) sectorMap.set(sec.id, sec);
      } catch {
        // floor pode não existir / 404 - ignorar
      }
    }

    const waypoints = [...waypointMap.values()];
    const sectors = [...sectorMap.values()];
    saveWaypoints(waypoints);
    saveSectors(sectors);

    const { objectiveCount } = await buildObjectiveWaypointIndex({
      includeAchievementBits: true,
    });

    const schedule = await refreshEventSchedule();

    const currencies = await gw2Fetch<CurrencyEntry[]>("/currencies", {
      params: { ids: "all" },
    });
    saveCurrencies(
      [...currencies].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    );

    const mapIds = await gw2Fetch<number[]>("/maps");
    const maps: MapEntry[] = [];
    const chunk = 50;
    for (let i = 0; i < mapIds.length; i += chunk) {
      const batch = mapIds.slice(i, i + chunk);
      const rows = await gw2Fetch<
        Array<{
          id: number;
          name: string;
          min_level?: number;
          max_level?: number;
        }>
      >("/maps", { params: { ids: batch.join(",") } });
      for (const m of rows) {
        maps.push({
          id: m.id,
          name: m.name,
          minLevel: m.min_level,
          maxLevel: m.max_level,
        });
      }
    }
    saveMaps(maps);

    const masteryRaw = await gw2Fetch<
      Array<{
        id: number;
        name: string;
        requirement?: string;
        order?: number;
        background?: string;
        region: string;
        levels?: Array<{
          name: string;
          description?: string;
          instruction?: string;
          icon?: string;
          point_cost?: number;
          exp_cost?: number;
        }>;
      }>
    >("/masteries", { params: { ids: "all" } });
    const masteries: MasteryTrackEntry[] = masteryRaw
      .map((m) => ({
        id: m.id,
        name: m.name,
        requirement: m.requirement ?? "",
        order: m.order ?? 0,
        background: m.background,
        region: m.region,
        levels: (m.levels ?? []).map((lv) => ({
          name: lv.name,
          description: lv.description ?? "",
          instruction: lv.instruction ?? "",
          icon: lv.icon,
          pointCost: lv.point_cost ?? 0,
          expCost: lv.exp_cost ?? 0,
        })),
      }))
      .sort((a, b) => a.order - b.order || a.id - b.id);
    saveMasteries(masteries);
    const wvwRanks = await refreshWvwRanks();
    saveStoryBeats(STORY_BEATS_SEED);

    saveCatalogMeta({
      buildId: build.id,
      refreshedAt: new Date().toISOString(),
      waypointCount: waypoints.length,
      sectorCount: sectors.length,
      objectiveCount,
      eventCount: schedule.eventCount,
      scheduleVersion: schedule.scheduleVersion,
      scheduleRefreshedAt: new Date().toISOString(),
      currencyCount: currencies.length,
      mapCount: maps.length,
      masteryCount: masteries.length,
      wvwRankCount: wvwRanks.length,
      storyBeatCount: STORY_BEATS_SEED.length,
    });

    return {
      updated: true,
      buildId: build.id,
      waypointCount: waypoints.length,
      sectorCount: sectors.length,
      objectiveCount,
      eventCount: schedule.eventCount,
      scheduleVersion: schedule.scheduleVersion,
      masteryCount: masteries.length,
      wvwRankCount: wvwRanks.length,
      storyBeatCount: STORY_BEATS_SEED.length,
      mapCount: maps.length,
      currencyCount: currencies.length,
    };
  } catch (error) {
    const meta = loadCatalogMeta();
    return {
      updated: false,
      buildId: meta?.buildId ?? 0,
      waypointCount: meta?.waypointCount ?? 0,
      sectorCount: meta?.sectorCount ?? 0,
      objectiveCount: meta?.objectiveCount ?? 0,
      eventCount: meta?.eventCount ?? 0,
      scheduleVersion: meta?.scheduleVersion,
      error: error instanceof Error ? error.message : "Falha no catálogo",
    };
  }
}

export { normalizeCatalogText } from "@/lib/catalog/normalize";
