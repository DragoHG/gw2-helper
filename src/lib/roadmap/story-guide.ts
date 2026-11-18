import { loadStoryBeats } from "@/lib/catalog/store";
import { STORY_BEATS_SEED } from "@/lib/catalog/story-beats";
import { findNearestWaypoint } from "@/lib/geo/waypoints";
import { hasExpansion } from "@/lib/gw2/access";
import type { AccountSnapshot } from "@/lib/gw2/types";
import { resolveAccountStage } from "@/lib/gw2/stage";
import { wikiSearch } from "@/lib/wiki";
import type { RoadmapStep } from "@/lib/roadmap/types";

/**
 * Capítulos acionáveis. Quest IDs da API são opacos -
 * cruzamos expansão + estágio + achievements relacionados.
 */
export function storyRoadmapSteps(snapshot: AccountSnapshot): RoadmapStep[] {
  const stage = resolveAccountStage(snapshot);
  const beats =
    loadStoryBeats().length > 0 ? loadStoryBeats() : STORY_BEATS_SEED;
  const achBlob = (snapshot.achievements ?? [])
    .map((a) => {
      const def = snapshot.achievementIndex?.[a.id];
      return `${def?.name ?? ""} ${def?.requirement ?? ""}`;
    })
    .join(" ")
    .toLowerCase();

  const out: RoadmapStep[] = [];

  for (const beat of beats) {
    if (beat.expansion && !hasExpansion(snapshot, beat.expansion)) continue;
    if (
      beat.forLeveling &&
      stage.stage !== "f2p" &&
      stage.stage !== "leveling" &&
      !beat.forCore80
    ) {
      continue;
    }

    const relatedHits = beat.relatedAchievementHints.filter((h) =>
      achBlob.includes(h.toLowerCase()),
    );
    const wp = findNearestWaypoint(beat.wpHints);
    const priority =
      beat.forLeveling && (stage.stage === "f2p" || stage.stage === "leveling")
        ? 92
        : beat.forCore80 && stage.stage === "core80"
          ? 78
          : relatedHits.length
            ? 62
            : 55;

    const unlockLine = beat.unlocks.length
      ? `Desbloqueia: ${beat.unlocks.slice(0, 4).join(" · ")}.`
      : "";
    const achLine = relatedHits.length
      ? `Achievements no tema já na conta - feche bits fáceis em Achievements.`
      : `No mesmo mapa, busque achievements/metas alinhados (${beat.bundleMaps.slice(0, 2).join(", ") || beat.where}).`;

    out.push({
      id: beat.id,
      lane: "story",
      priority,
      title: beat.title,
      why: `${beat.why} ${unlockLine}`.trim(),
      how: `${beat.how} ${achLine}`,
      where: beat.where,
      chatLink: wp?.waypoint.chatLink,
      teleportLabel: wp
        ? `${wp.waypoint.name} - ${wp.waypoint.mapName}`
        : undefined,
      wikiUrl: wikiSearch(beat.wiki),
      href: "/achievements",
      hrefLabel: "Achievements no tema",
      bundleWith: [
        ...beat.unlocks.slice(0, 3),
        ...beat.bundleMaps.slice(0, 2).map((m) => `Mapa: ${m}`),
      ],
    });
  }

  return out.sort((a, b) => b.priority - a.priority).slice(0, 5);
}
