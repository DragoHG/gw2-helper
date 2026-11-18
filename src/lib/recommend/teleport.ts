import { findNearestWaypoint } from "@/lib/geo/waypoints";
import type { Recommendation } from "@/lib/recommend/types";

/** Anexa chat_link ao meta se houver WP para as dicas. Nunca lança. */
export function withTeleport(
  rec: Recommendation,
  hints: Array<string | undefined | null>,
): Recommendation {
  try {
    const cleaned = hints.filter((h): h is string => Boolean(h && h.trim()));
    if (!cleaned.length) return rec;
    if (typeof rec.meta?.chatLink === "string" && rec.meta.chatLink) return rec;
    const wp = findNearestWaypoint(cleaned);
    if (!wp?.waypoint?.chatLink) return rec;
    return {
      ...rec,
      meta: {
        ...rec.meta,
        chatLink: wp.waypoint.chatLink,
        teleportLabel: `${wp.waypoint.name} - ${wp.waypoint.mapName}`,
        teleportReason: wp.reason,
      },
    };
  } catch {
    return rec;
  }
}
