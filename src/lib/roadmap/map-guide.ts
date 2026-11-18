import { findNearestWaypoint } from "@/lib/geo/waypoints";
import { hasExpansion } from "@/lib/gw2/access";
import type { AccountSnapshot } from "@/lib/gw2/types";
import { resolveAccountStage } from "@/lib/gw2/stage";
import { wikiSearch } from "@/lib/wiki";
import type { RoadmapStep } from "@/lib/roadmap/types";

interface MapFocus {
  id: string;
  mapName: string;
  why: string;
  how: string;
  expansion?: Parameters<typeof hasExpansion>[1];
  forLeveling?: boolean;
  priority: number;
}

const MAPS: MapFocus[] = [
  {
    id: "map-queensdale",
    mapName: "Queensdale",
    why: "Mapa core fácil para XP, hearts e primeiros achievements.",
    how: "Complete hearts, eventos e explore setores. Bom para conta nova / leveling.",
    forLeveling: true,
    priority: 70,
  },
  {
    id: "map-wayfarer",
    mapName: "Wayfarer Foothills",
    why: "World bosses e exploração core densos.",
    how: "Faça eventos, hearts e o world boss quando a timeline marcar.",
    forLeveling: true,
    priority: 68,
  },
  {
    id: "map-la",
    mapName: "Lion's Arch",
    why: "Hub: TP, Fractals, Laurel Merchant, crafting, LFG.",
    how: "Use como base entre farms. Pegue delivery do TP e vá ao portal de Fractals se estiver no 80.",
    priority: 60,
  },
  {
    id: "map-vb",
    mapName: "Verdant Brink",
    why: "Meta HoT + gliding XP - ótimo multiobjetivo mastery/achievements.",
    how: "Entre na meta noturna, farm mastery XP Maguuma e bits de achievements do mapa.",
    expansion: "HeartOfThorns",
    priority: 75,
  },
  {
    id: "map-oasis",
    mapName: "Crystal Oasis",
    why: "Hub PoF: story, mounts e metas do deserto.",
    how: "Avance story/mounts e use LFG para bounties/metas se o mapa estiver ativo.",
    expansion: "PathOfFire",
    priority: 76,
  },
  {
    id: "map-seitung",
    mapName: "Seitung Province",
    why: "Porta de entrada EoD - story, skiff e mastery Cantha.",
    how: "Siga hearts/story e farm mastery XP Cantha nas metas locais.",
    expansion: "EndOfDragons",
    priority: 74,
  },
  {
    id: "map-skywatch",
    mapName: "Skywatch Archipelago",
    why: "Hub SotO - caminho do Skyscale e mastery.",
    how: "Story + metas + collections do Skyscale.",
    expansion: "SecretsOfTheObscure",
    priority: 73,
  },
  {
    id: "map-lowland",
    mapName: "Lowland Shore",
    why: "Entrada Janthir Wilds.",
    how: "Explore, story e mastery points JW.",
    expansion: "JanthirWilds",
    priority: 72,
  },
  {
    id: "map-shipwreck",
    mapName: "Shipwreck Strand",
    why: "Entrada VoE / Castora - story e mastery do conteúdo novo.",
    how: "Avance a story VoE, farm mastery XP e metas locais; combine com achievements do mapa.",
    expansion: "VisionsOfEternity",
    priority: 77,
  },
  {
    id: "map-starlit",
    mapName: "Starlit Weald",
    why: "Mapa VoE denso para multiobjetivo (story + mastery + ach).",
    how: "Siga story/metas e bits de achievements enquanto farma mastery VoE.",
    expansion: "VisionsOfEternity",
    priority: 76,
  },
];

export function mapRoadmapSteps(snapshot: AccountSnapshot): RoadmapStep[] {
  const stage = resolveAccountStage(snapshot);
  const out: RoadmapStep[] = [];

  for (const m of MAPS) {
    if (m.expansion && !hasExpansion(snapshot, m.expansion)) continue;
    if (
      m.forLeveling &&
      stage.stage !== "f2p" &&
      stage.stage !== "leveling" &&
      !m.expansion
    ) {
      continue;
    }
    const wp = findNearestWaypoint([m.mapName]);
    out.push({
      id: m.id,
      lane: "maps",
      priority: m.priority,
      title: `Mapa em foco: ${m.mapName}`,
      why: m.why,
      how: m.how,
      where: m.mapName,
      chatLink: wp?.waypoint.chatLink,
      teleportLabel: wp
        ? `${wp.waypoint.name} - ${wp.waypoint.mapName}`
        : m.mapName,
      wikiUrl: wikiSearch(m.mapName),
      href: "/events",
      hrefLabel: "Eventos neste mapa",
    });
  }

  return out.sort((a, b) => b.priority - a.priority).slice(0, 5);
}
