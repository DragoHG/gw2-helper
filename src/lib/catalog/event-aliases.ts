/**
 * Fonte única de aliases de world bosses / metas → setor ou waypoint no catálogo.
 * Usado por objective-index, geo/waypoints e events-schedule.
 */
export const OBJECTIVE_ALIASES: Record<string, string[]> = {
  // Core world bosses
  "great jungle wurm": ["wychmire swamp", "wychmire waypoint"],
  "fire elemental": ["thaumanova reactor", "desider atum", "muridian"],
  "shadow behemoth": ["godslost swamp", "godslost waypoint"],
  "svanir shaman chief": ["shaman s rookery", "svanir s dome"],
  "modniir ulgoth": ["modniir gorge"],
  "claw of jormag": ["frostwalk tundra"],
  "tequatl the sunless": ["splintered teeth", "sparkfly fen"],
  megadestroyer: ["magmatic rim", "mount maelstrom"],
  "karka queen": ["pearl islet", "southsun cove"],
  "triple trouble": ["firthside vigil", "bloodtide coast"],
  "the shatterer": ["lowland burns", "blazeridge steppes"],
  shatterer: ["lowland burns", "blazeridge steppes"],
  "admiral taidha covington": ["laughing gull island", "bloodtide coast"],
  "taidha covington": ["laughing gull island", "bloodtide coast"],
  "golem mark ii": ["muridian uplands", "metrica province"],
  "inquest golem mark ii": ["muridian uplands", "metrica province"],
  drakkar: ["bjora marches", "drakkar nest"],

  // Metas HoT / PoF frequentes
  "amber gerent": ["auric basin", "westwatch"],
  "jade maw": ["tangled depths"],
  octovine: ["auric basin", "tarir"],
  "chak gerent": ["tangled depths"],
  "mordremoth": ["dragon s stand"],
  "dragon s stand": ["dragon s stand"],
  "verdant brink": ["verdant brink", "pact encampment"],
  "crystal oasis": ["crystal oasis", "temple of kormir"],
  "desert highlands": ["desert highlands", "deri"],
  "elon riverlands": ["elon riverlands"],
  "the desolation": ["the desolation"],
  "domain of vabbi": ["domain of vabbi"],

  // EoD / SotO / Janthir (metas frequentes)
  "seitung province": ["seitung province", "arborstone"],
  "new kaineng": ["new kaineng city"],
  "dragon s end": ["dragon s end"],
  "echovald wilds": ["echovald wilds"],
  "skywatch archipelago": ["skywatch archipelago"],
  amnytas: ["amnytas"],
  "inner nayos": ["inner nayos"],
  "lowland shore": ["lowland shore"],
  "janthir syntri": ["janthir syntri"],
  skyscale: ["skywatch archipelago", "amnytas"],

  // Metas nomeadas EoD / SotO / LW / VoE
  "aetherblade assault": ["seitung province"],
  "kaineng blackout": ["new kaineng city"],
  "the battle for the jade sea": ["dragon s end"],
  "gangwars": ["echovald wilds"],
  "unlocking the wizard s tower": ["skywatch archipelago"],
  "defense of amnytas": ["amnytas"],
  "converging nightmare": ["inner nayos"],
  "boneskinner rumble": ["bjora marches"],
  castora: ["castora", "starlit weald", "shipwreck strand"],
  "starlit weald": ["starlit weald"],
  "shipwreck strand": ["shipwreck strand"],
  "eternity's garden": ["eternity's garden", "starlit weald"],
  "leyspring hollows": ["leyspring hollows", "shipwreck strand"],
};

/** Nome normalizado → id de /account/worldbosses */
export const WORLD_BOSS_API_IDS: Record<string, string> = {
  "admiral taidha covington": "admiral_taidha_covington",
  "taidha covington": "admiral_taidha_covington",
  "svanir shaman chief": "svanir_shaman_chief",
  megadestroyer: "megadestroyer",
  "fire elemental": "fire_elemental",
  "the shatterer": "shatterer",
  shatterer: "shatterer",
  "great jungle wurm": "great_jungle_wurm",
  "modniir ulgoth": "modniir_ulgoth",
  "shadow behemoth": "shadow_behemoth",
  "claw of jormag": "claw_of_jormag",
  "golem mark ii": "inquest_golem_mark_ii",
  "inquest golem mark ii": "inquest_golem_mark_ii",
  "tequatl the sunless": "tequatl_the_sunless",
  "karka queen": "karka_queen",
  "triple trouble": "triple_trouble",
  drakkar: "drakkar",
};
