import { WORLD_BOSS_API_IDS } from "@/lib/catalog/event-aliases";
import { isFestivalText } from "@/lib/catalog/festivals";
import { normalizeCatalogText } from "@/lib/catalog/normalize";
import { saveEventSchedule } from "@/lib/catalog/store";
import type {
  EventExpansionKey,
  EventKind,
  ScheduledEventEntry,
} from "@/lib/catalog/types";
import { findNearestWaypoint } from "@/lib/geo/waypoints";
import { matchLivingWorldEpisode } from "@/lib/living-world/episodes";

const WIKI_SCHEDULE_URL =
  "https://wiki.guildwars2.com/wiki/Widget:Event_timer/data.json?action=raw";

type WikiSegment = {
  name?: string;
  link?: string;
  chatlink?: string;
};

type WikiGroup = {
  category?: string;
  name?: string;
  link?: string;
  segments?: Record<string, WikiSegment>;
  sequences?: {
    partial?: Array<{ r: number | string; d: number }>;
    pattern?: Array<{ r: number | string; d: number }>;
  };
};

type WikiPayload = {
  config?: { version?: string };
  events?: Record<string, WikiGroup>;
};

const SKIP_GROUP_KEYS = new Set(["t"]);
const SKIP_NAME_RE =
  /day and night|pvp tournament|tournament|placeholder|^$/i;

function decodeChatlink(raw?: string): string | undefined {
  if (!raw) return undefined;
  return raw.replace(/\\u0026/g, "&").trim() || undefined;
}

function inferExpansion(category: string, groupName: string): EventExpansionKey {
  const blob = `${category} ${groupName}`.toLowerCase();
  if (/heart of thorns|hot|maguuma|auric|tangled|verdant|dragon'?s stand/.test(blob))
    return "HeartOfThorns";
  if (/path of fire|pof|crystal desert|elon|desert/.test(blob)) return "PathOfFire";
  if (/end of dragons|eod|cantha|seitung|new kaiteng|dragon'?s end/.test(blob))
    return "EndOfDragons";
  if (/secrets of the obscure|soto|skywatch|amnytas|inner nayos/.test(blob))
    return "SecretsOfTheObscure";
  if (/janthir|lowland shore|janthir syntri/.test(blob)) return "JanthirWilds";
  if (
    /visions of eternity|castora|starlit|shipwreck strand|leyspring|eternity.s garden/.test(
      blob,
    )
  )
    return "VisionsOfEternity";
  if (matchLivingWorldEpisode(blob) || /living world|ley-line|invasion|icebrood|bjora/.test(blob))
    return "living_world";
  if (/core|tyria|fractal/.test(blob)) return "core";
  return "unknown";
}

function inferKind(groupName: string, eventName: string): EventKind {
  const blob = `${groupName} ${eventName}`.toLowerCase();
  if (isFestivalText(groupName, eventName)) return "festival";
  if (/world boss/.test(blob)) return "world_boss";
  if (matchLivingWorldEpisode(blob) || /living world|ley-line|invasion/.test(blob))
    return "living_world";
  if (/day and night|tournament|pvp/.test(blob)) return "other";
  return "meta";
}

function shouldSkipGroup(groupId: string, group: WikiGroup): boolean {
  if (SKIP_GROUP_KEYS.has(groupId)) return true;
  const name = group.name ?? "";
  if (SKIP_NAME_RE.test(name)) return true;
  if (/pvp tournament/i.test(group.category ?? "")) return true;
  return false;
}

/**
 * Baixa o schedule da wiki e grava events-schedule.json no catálogo local.
 * Horários são agendados (UTC), não live.
 */
export async function refreshEventSchedule(): Promise<{
  eventCount: number;
  scheduleVersion: string;
}> {
  const res = await fetch(WIKI_SCHEDULE_URL, {
    headers: {
      Accept: "application/json,text/plain,*/*",
      // Wiki bloqueia fetch sem UA (403)
      "User-Agent": "GW2Helper/1.0 (local account helper; offline catalog refresh)",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Wiki schedule HTTP ${res.status}`);
  }
  const text = await res.text();
  const payload = JSON.parse(text) as WikiPayload;
  const version = payload.config?.version ?? "unknown";
  const events: ScheduledEventEntry[] = [];

  for (const [groupId, group] of Object.entries(payload.events ?? {})) {
    if (shouldSkipGroup(groupId, group)) continue;
    const patternRaw = group.sequences?.pattern ?? [];
    if (!patternRaw.length) continue;

    const category = group.category ?? "";
    const groupName = group.name ?? groupId;
    const expansion = inferExpansion(category, groupName);

    // Um registro por segmento nomeado que aparece no pattern
    const segmentIdsInPattern = new Set(
      patternRaw.map((p) => String(p.r)).filter((id) => id !== "0"),
    );

    for (const segId of segmentIdsInPattern) {
      const seg = group.segments?.[segId];
      const name = (seg?.name ?? "").trim();
      if (!name || SKIP_NAME_RE.test(name)) continue;

      const nameKey = normalizeCatalogText(name);
      const kind = inferKind(groupName, name);
      let chatLink = decodeChatlink(seg?.chatlink);
      if (!chatLink) {
        const wp = findNearestWaypoint([name, groupName, category]);
        chatLink = wp?.waypoint.chatLink;
      }

      const pattern = patternRaw.map((p) => ({
        segmentKey: String(p.r),
        durationMinutes: Number(p.d) || 0,
      }));

      events.push({
        id: `${groupId}:${segId}`,
        groupId,
        groupName,
        category,
        name,
        kind,
        expansion,
        wikiQuery: seg?.link || name,
        chatLink,
        worldBossApiId: WORLD_BOSS_API_IDS[nameKey],
        pattern,
        nameKey,
      });
    }
  }

  saveEventSchedule(events);
  return { eventCount: events.length, scheduleVersion: version };
}
