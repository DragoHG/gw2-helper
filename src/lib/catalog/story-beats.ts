import type { ExpansionId } from "@/lib/gw2/access";

/** Beat de história no DB do jogo (público) - não é progresso da conta. */
export interface StoryBeatCatalog {
  id: string;
  title: string;
  why: string;
  how: string;
  where: string;
  wpHints: string[];
  wiki: string;
  /** Expansão "dona" do capítulo (bloqueia se a conta não tem). */
  expansion?: ExpansionId;
  /**
   * Para Living World / episódios: conta precisa desta expansão base
   * (ex.: LW4 precisa Path of Fire) mesmo sem flag própria na API.
   */
  requiresExpansion?: ExpansionId;
  /** Season LW (2-5) - usado no ranking pós-expansão. */
  livingWorldSeason?: 2 | 3 | 4 | 5;
  forLeveling?: boolean;
  forCore80?: boolean;
  /** O que a história desbloqueia (montaria, mastery, mapa…). */
  unlocks: string[];
  /** Keywords para casar achievements / metas no mesmo mapa. */
  relatedAchievementHints: string[];
  bundleMaps: string[];
}

/** Fonte embutida - copiada para catalog/story-beats.json no refresh. */
export const STORY_BEATS_SEED: StoryBeatCatalog[] = [
  {
    id: "story-personal",
    title: "História pessoal (core)",
    why: "Libera mapas core, hearts e a base da conta sem expansão.",
    how: "Story Journal (J) - avance os capítulos da sua raça até Orr / nível 80.",
    where: "Capital da raça ou Lion's Arch.",
    wpHints: ["Lion's Arch"],
    wiki: "Personal story",
    forLeveling: true,
    unlocks: [
      "Mapas core até Orr",
      "Hearts e renown",
      "Base para Ascended depois do 80",
    ],
    relatedAchievementHints: ["personal story", "hero", "tyria"],
    bundleMaps: ["Queensdale", "Wayfarer Foothills", "Lion's Arch"],
  },
  {
    id: "story-hot",
    title: "História Heart of Thorns",
    why: "Abre Maguuma, gliding e masteries HoT.",
    how: "Story Journal - Heart of Thorns. Verdant Brink - Auric Basin - Tangled Depths - Dragon's Stand.",
    where: "Verdant Brink.",
    wpHints: ["Verdant Brink", "Pact Encampment"],
    wiki: "Heart of Thorns story",
    expansion: "HeartOfThorns",
    forCore80: true,
    unlocks: ["Gliding", "Masteries Maguuma", "Metas HoT", "Itzel/Nuhoch/Exalted"],
    relatedAchievementHints: [
      "verdant",
      "auric",
      "tangled",
      "dragon's stand",
      "gliding",
    ],
    bundleMaps: ["Verdant Brink", "Auric Basin", "Tangled Depths"],
  },
  {
    id: "story-pof",
    title: "História Path of Fire",
    why: "Libera mounts (Raptor/Springer/Skimmer/Jackal) e o deserto.",
    how: "Story Journal - Path of Fire. Crystal Oasis é o hub - avance até liberar o Jackal.",
    where: "Crystal Oasis.",
    wpHints: ["Crystal Oasis", "Temple of Kormir"],
    wiki: "Path of Fire story",
    expansion: "PathOfFire",
    forCore80: true,
    unlocks: ["Raptor", "Springer", "Skimmer", "Jackal", "Masteries Desert"],
    relatedAchievementHints: ["crystal oasis", "elon", "jackal", "path of fire"],
    bundleMaps: ["Crystal Oasis", "Desert Highlands", "Elon Riverlands"],
  },
  {
    id: "story-lws4",
    title: "Living World Season 4",
    why: "Continuidade natural depois da história Path of Fire - mapas Istan até Dragonfall e masteries do deserto.",
    how: "Story Journal / episódios Living World Season 4 (Daybreak → All or Nothing). Se o episódio não estiver na conta, compre na loja Gem ou no Black Lion. Comece em Domain of Istan.",
    where: "Domain of Istan.",
    wpHints: ["Domain of Istan", "Free City of Amnoon"],
    wiki: "Living World Season 4",
    requiresExpansion: "PathOfFire",
    livingWorldSeason: 4,
    unlocks: [
      "Mapas LW4 (Istan, Sandswept, Jahai, Thunderhead, Dragonfall)",
      "Masteries Desert avançadas",
      "Roller Beetle (coleções/episódios)",
    ],
    relatedAchievementHints: [
      "season 4",
      "lws4",
      "domain of istan",
      "sandswept",
      "jahai",
      "thunderhead",
      "dragonfall",
      "daybreak",
      "a bug in the system",
      "all or nothing",
    ],
    bundleMaps: [
      "Domain of Istan",
      "Sandswept Isles",
      "Domain of Kourna",
      "Jahai Bluffs",
      "Thunderhead Peaks",
      "Dragonfall",
    ],
  },
  {
    id: "story-eod",
    title: "História End of Dragons",
    why: "Abre Cantha, skiff e Jade Bot.",
    how: "Story Journal - End of Dragons. Seitung - New Kaineng / Dragon's End.",
    where: "Seitung Province / Arborstone.",
    wpHints: ["Seitung Province", "Arborstone"],
    wiki: "End of Dragons story",
    expansion: "EndOfDragons",
    unlocks: ["Skiff", "Jade Bot", "Masteries Cantha", "Fishing"],
    relatedAchievementHints: ["seitung", "kaineng", "dragon's end", "skiff"],
    bundleMaps: ["Seitung Province", "New Kaineng City", "Dragon's End"],
  },
  {
    id: "story-soto",
    title: "História Secrets of the Obscure",
    why: "Abre Skywatch/Amnytas e o caminho do Skyscale.",
    how: "Story Journal - SotO. Siga até as collections do Skyscale.",
    where: "Skywatch Archipelago.",
    wpHints: ["Skywatch Archipelago"],
    wiki: "Secrets of the Obscure story",
    expansion: "SecretsOfTheObscure",
    unlocks: ["Skyscale (collections)", "Masteries SotO", "Weaponmaster training"],
    relatedAchievementHints: ["skywatch", "amnytas", "skyscale", "obscure"],
    bundleMaps: ["Skywatch Archipelago", "Amnytas"],
  },
  {
    id: "story-jw",
    title: "História Janthir Wilds",
    why: "Abre mapas e masteries de Janthir.",
    how: "Story Journal - Janthir Wilds. Lowland Shore e capítulos seguintes.",
    where: "Lowland Shore.",
    wpHints: ["Lowland Shore"],
    wiki: "Janthir Wilds story",
    expansion: "JanthirWilds",
    unlocks: ["Mapas Janthir", "Masteries JW", "Warclaw upgrades (contexto WvW/JW)"],
    relatedAchievementHints: ["lowland", "janthir", "mistburned"],
    bundleMaps: ["Lowland Shore", "Janthir Syntri"],
  },
  {
    id: "story-voe",
    title: "História Visions of Eternity",
    why: "Conteúdo mais novo - Castora, masteries e elites VoE.",
    how: "Story Journal - Visions of Eternity. Shipwreck Strand / Starlit Weald.",
    where: "Shipwreck Strand / Starlit Weald.",
    wpHints: ["Shipwreck Strand", "Starlit Weald"],
    wiki: "Visions of Eternity",
    expansion: "VisionsOfEternity",
    unlocks: [
      "Mapas Castora (Shipwreck Strand, Starlit Weald)",
      "Masteries VoE",
      "Elites VoE (após unlock da expansão)",
    ],
    relatedAchievementHints: [
      "shipwreck",
      "starlit",
      "castora",
      "visions of eternity",
      "eternity",
    ],
    bundleMaps: ["Shipwreck Strand", "Starlit Weald"],
  },
];
