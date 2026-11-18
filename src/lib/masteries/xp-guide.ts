import { regionMapHints } from "@/lib/masteries/regions";
import { findNearestWaypoint } from "@/lib/geo/waypoints";
import { wikiSearch } from "@/lib/wiki";

export interface MasteryXpGuide {
  region: string;
  why: string;
  how: string;
  where: string;
  activities: string[];
  wpHints: string[];
  wikiUrl: string;
  chatLink?: string;
  teleportLabel?: string;
}

const GUIDES: Array<Omit<MasteryXpGuide, "chatLink" | "teleportLabel" | "wikiUrl"> & { wiki: string }> = [
  {
    region: "Maguuma",
    why: "XP de mastery HoT sobe rápido em metas densas e map completion.",
    how: "Faça a meta do mapa (ou trechos), eventos no caminho, gathering e kills. Gliding ajuda a circular.",
    where: "Verdant Brink → Auric Basin → Tangled Depths → Dragon's Stand.",
    activities: [
      "Meta events (Night / Octovine / Chak Gerent / Mouth of Mordremoth)",
      "Map completion e hero challenges",
      "Gathering com masteries de Exalted/Itzel",
    ],
    wpHints: regionMapHints("Maguuma"),
    wiki: "Heart of Thorns mastery",
  },
  {
    region: "Desert",
    why: "XP PoF vem de metas do deserto e open world com mounts.",
    how: "Use Raptor/Springer/Jackal/Skimmer. Priorize metas e bounty trains se houver LFG.",
    where: "Crystal Oasis, Desert Highlands, Elon Riverlands, Domain of Vabbi.",
    activities: [
      "Map metas e bounties",
      "Hero points / map completion",
      "Mount training (se ainda faltar mount mastery)",
    ],
    wpHints: regionMapHints("Desert"),
    wiki: "Path of Fire mastery",
  },
  {
    region: "Cantha",
    why: "XP EoD sobe em Seitung / Kaineng / Dragon's End e atividades de skiff.",
    how: "Story abre mapas; depois farm metas e fishing/skiff onde couber.",
    where: "Seitung Province, New Kaineng City, Dragon's End, Arborstone.",
    activities: [
      "Map metas Cantha",
      "Fishing e skiff se a track pedir",
      "Jade Bot / turtle content quando desbloqueado",
    ],
    wpHints: regionMapHints("Cantha"),
    wiki: "End of Dragons mastery",
  },
  {
    region: "Secrets of the Obscure",
    why: "XP SotO em Skywatch, Amnytas e Inner Nayos.",
    how: "Metas e objetivos de Rift / tower. Skyscale acelera tudo.",
    where: "Skywatch Archipelago → Amnytas → Inner Nayos.",
    activities: ["Meta events SotO", "Rifts / public instances", "Map completion"],
    wpHints: regionMapHints("Secrets of the Obscure"),
    wiki: "Secrets of the Obscure mastery",
  },
  {
    region: "Janthir Wilds",
    why: "XP JW nos mapas de Janthir (Lowland Shore em diante).",
    how: "Explore, faça metas locais e objetivos de mastery da expansão.",
    where: "Lowland Shore e mapas seguintes da expansão.",
    activities: ["Metas Janthir", "Exploração / hero points", "Conteúdo da story da expansão"],
    wpHints: regionMapHints("Janthir"),
    wiki: "Janthir Wilds mastery",
  },
  {
    region: "Visions of Eternity",
    why: "XP VoE nos mapas da expansão atual.",
    how: "Siga a story e metas do mapa aberto da expansão.",
    where: "Mapas VoE / Castora (conforme desbloqueio da conta).",
    activities: ["Metas VoE", "Exploração", "Objetivos de mastery da expansão"],
    wpHints: regionMapHints("Visions of Eternity"),
    wiki: "Visions of Eternity mastery",
  },
  {
    region: "Tyria",
    why: "Central Tyria / Fractals: XP em open world core e fractals.",
    how: "World bosses, map completion core, dungeons/fractals conforme a track.",
    where: "Lion's Arch como hub; mapas 1-80; Mistlock para Fractals.",
    activities: [
      "World bosses e map completion",
      "Fractals (tracks de Fractal Attunement)",
      "Renown hearts / events em mapas core",
    ],
    wpHints: regionMapHints("Tyria"),
    wiki: "Central Tyria mastery",
  },
];

function matchGuide(region: string) {
  const r = region.toLowerCase();
  return (
    GUIDES.find((g) => r.includes(g.region.toLowerCase())) ??
    GUIDES.find((g) => {
      if (r.includes("maguuma") || r.includes("heart of thorns"))
        return g.region === "Maguuma";
      if (r.includes("desert") || r.includes("path of fire"))
        return g.region === "Desert";
      if (r.includes("cantha") || r.includes("jade") || r.includes("end of dragons"))
        return g.region === "Cantha";
      if (r.includes("obscure") || r.includes("soto"))
        return g.region === "Secrets of the Obscure";
      if (r.includes("janthir")) return g.region === "Janthir Wilds";
      if (r.includes("vision") || r.includes("eternity") || r.includes("castora"))
        return g.region === "Visions of Eternity";
      if (r.includes("fractal")) return g.region === "Tyria";
      return false;
    }) ??
    GUIDES[GUIDES.length - 1]
  );
}

export function resolveMasteryXpGuide(region: string): MasteryXpGuide {
  const g = matchGuide(region);
  const wp = findNearestWaypoint(g.wpHints);
  return {
    region: g.region,
    why: g.why,
    how: g.how,
    where: g.where,
    activities: g.activities,
    wpHints: g.wpHints,
    wikiUrl: wikiSearch(g.wiki),
    chatLink: wp?.waypoint.chatLink,
    teleportLabel: wp
      ? `${wp.waypoint.name} - ${wp.waypoint.mapName}`
      : undefined,
  };
}
