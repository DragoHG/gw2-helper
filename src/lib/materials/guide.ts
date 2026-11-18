import { findNearestWaypoint } from "@/lib/geo/waypoints";
import { wikiSearch } from "@/lib/wiki";

export interface MaterialGuide {
  key: string;
  /** Match parcial no nome do item (lowercase). */
  match: string[];
  title: string;
  why: string;
  how: string;
  where: string;
  /** Hints para findNearestWaypoint */
  wpHints: string[];
  wikiQuery: string;
  ascendedUse: boolean;
}

/** Guia estático de farm/compra - qualquer conta; WP vem do catálogo local. */
export const MATERIAL_GUIDES: MaterialGuide[] = [
  {
    key: "ecto",
    match: ["glob of ectoplasm"],
    title: "Glob of Ectoplasm",
    why: "Base de quase todo craft Ascended e gifts lendários.",
    how: "Salvage (kit Rare/Exotic ou Mystic) em rares e exotics. Melhores drops: metas densas e world bosses. Alternativa: Trading Post.",
    where:
      "World bosses core (Tequatl, Shatterer, Claw of Jormag…) ou metas HoT/PoF/EoD se tiver a expansão. Hub: Lion's Arch.",
    wpHints: [
      "Lion's Arch",
      "Wayfarer Foothills",
      "Blazeridge Steppes",
      "Frostgorge Sound",
    ],
    wikiQuery: "Glob of Ectoplasm",
    ascendedUse: true,
  },
  {
    key: "dust",
    match: ["pile of crystalline dust"],
    title: "Pile of Crystalline Dust",
    why: "Ingrediente comum em Ascended e refinados.",
    how: "Salvage de rares/exotics ou refine dusts menores na crafting station.",
    where: "Crafting em Lion's Arch, ou farm loot em mapas 70-80 / metas.",
    wpHints: ["Lion's Arch"],
    wikiQuery: "Pile of Crystalline Dust",
    ascendedUse: true,
  },
  {
    key: "ecto-blood",
    match: ["vial of powerful blood"],
    title: "Vial of Powerful Blood",
    why: "Mat Ascended (armas/armadura).",
    how: "Salvage rares/exotics de criaturas com sangue, ou Trading Post.",
    where: "Open world + salvage. Bom fluxo: world bosses → salvage na cidade.",
    wpHints: ["Lion's Arch", "Fields of Ruin"],
    wikiQuery: "Vial of Powerful Blood",
    ascendedUse: true,
  },
  {
    key: "fang",
    match: ["vicious fang"],
    title: "Vicious Fang",
    why: "Mat Ascended.",
    how: "Salvage rares/exotics de feras, ou TP. Metas com muitos mobs ajudam.",
    where: "Mapas com cats/wolves/drakes high-level; salvage na cidade.",
    wpHints: ["Lion's Arch", "Timberline Falls"],
    wikiQuery: "Vicious Fang",
    ascendedUse: true,
  },
  {
    key: "claw",
    match: ["vicious claw"],
    title: "Vicious Claw",
    why: "Mat Ascended.",
    how: "Salvage rares/exotics ou TP.",
    where: "Open world / metas → salvage em Lion's Arch.",
    wpHints: ["Lion's Arch", "Sparkfly Fen"],
    wikiQuery: "Vicious Claw",
    ascendedUse: true,
  },
  {
    key: "scale",
    match: ["armored scale"],
    title: "Armored Scale",
    why: "Mat Ascended.",
    how: "Salvage rares/exotics de criaturas com escamas, ou TP.",
    where: "Mapas com drakes/wurms; world bosses também geram loot salvageável.",
    wpHints: ["Lion's Arch", "Mount Maelstrom"],
    wikiQuery: "Armored Scale",
    ascendedUse: true,
  },
  {
    key: "bone",
    match: ["ancient bone"],
    title: "Ancient Bone",
    why: "Mat Ascended.",
    how: "Salvage rares/exotics ou TP.",
    where: "Open world / undead high-level → salvage.",
    wpHints: ["Lion's Arch", "Cursed Shore"],
    wikiQuery: "Ancient Bone",
    ascendedUse: true,
  },
  {
    key: "totem",
    match: ["elaborate totem"],
    title: "Elaborate Totem",
    why: "Mat Ascended.",
    how: "Salvage rares/exotics de humanoides/cultistas, ou TP.",
    where: "Mapas Orr / cultos; salvage na cidade.",
    wpHints: ["Lion's Arch", "Malchor's Leap"],
    wikiQuery: "Elaborate Totem",
    ascendedUse: true,
  },
  {
    key: "venom",
    match: ["powerful venom sac"],
    title: "Powerful Venom Sac",
    why: "Mat Ascended.",
    how: "Salvage rares/exotics de insetos/aranhas, ou TP.",
    where: "Mapas com spiders/insects high-level → salvage.",
    wpHints: ["Lion's Arch", "Brisban Wildlands"],
    wikiQuery: "Powerful Venom Sac",
    ascendedUse: true,
  },
  {
    key: "thermo",
    match: ["thermocatalytic reagent"],
    title: "Thermocatalytic Reagent",
    why: "Forge e craft Ascended.",
    how: "Compre no Trading Post (mais fácil) ou craft na Mystic Forge.",
    where: "Lion's Arch - Mystic Forge (praça central) ou Trading Post.",
    wpHints: ["Lion's Arch", "Mystic Plaza"],
    wikiQuery: "Thermocatalytic Reagent",
    ascendedUse: true,
  },
  {
    key: "mithril",
    match: ["lump of mithrillium", "mithrillium"],
    title: "Lump of Mithrillium",
    why: "Refinado para Ascended.",
    how: "Craft com mithril ore + ectos + dust (disciplina alta), ou TP.",
    where: "Craft em Lion's Arch. Ore: nós de mithril em mapas 60-80.",
    wpHints: ["Lion's Arch", "Fireheart Rise"],
    wikiQuery: "Lump of Mithrillium",
    ascendedUse: true,
  },
  {
    key: "orichalcum",
    match: ["orichalcum"],
    title: "Orichalcum",
    why: "Metal top para Ascended e lendários.",
    how: "Mine nós Orichalcum (mapas 75-80 / expansões) e refine, ou compre no TP.",
    where: "Nós em Cursed Shore, Southsun, expansões; refine em Lion's Arch.",
    wpHints: ["Lion's Arch", "Cursed Shore", "Southsun Cove"],
    wikiQuery: "Orichalcum Ore",
    ascendedUse: true,
  },
  {
    key: "silk",
    match: ["silk weaving thread"],
    title: "Spool of Silk Weaving Thread",
    why: "Armadura Ascended leve.",
    how: "Craft (Tailor 400+) ou Trading Post.",
    where: "Crafting station - Lion's Arch.",
    wpHints: ["Lion's Arch"],
    wikiQuery: "Spool of Silk Weaving Thread",
    ascendedUse: true,
  },
  {
    key: "thick",
    match: ["thick crafting thread"],
    title: "Spool of Thick Crafting Thread",
    why: "Armadura Ascended média.",
    how: "Craft (Leatherworker) ou TP.",
    where: "Crafting station - Lion's Arch.",
    wpHints: ["Lion's Arch"],
    wikiQuery: "Spool of Thick Crafting Thread",
    ascendedUse: true,
  },
  {
    key: "coiled",
    match: ["coiled thread"],
    title: "Spool of Coiled Thread",
    why: "Armadura Ascended pesada.",
    how: "Craft (Armorsmith) ou TP.",
    where: "Crafting station - Lion's Arch.",
    wpHints: ["Lion's Arch"],
    wikiQuery: "Spool of Coiled Thread",
    ascendedUse: true,
  },
  {
    key: "spirit",
    match: ["spirit shard"],
    title: "Spirit Shard",
    why: "Craft Ascended e conversões úteis.",
    how: "Vêm de level-up, achievements e rewards. Troque em vendors de Laurel/Spirit.",
    where: "Lion's Arch - vendors perto do waypoint central.",
    wpHints: ["Lion's Arch"],
    wikiQuery: "Spirit Shard",
    ascendedUse: true,
  },
  {
    key: "obsidian",
    match: ["obsidian shard"],
    title: "Obsidian Shard",
    why: "Lendários e alguns crafts altos.",
    how: "Compre com karma em vendors de mapas 70-80, fractals, ou TP.",
    where: "Vendors de karma (ex.: Cursed Shore) ou Lion's Arch.",
    wpHints: ["Lion's Arch", "Cursed Shore", "Verdant Brink"],
    wikiQuery: "Obsidian Shard",
    ascendedUse: false,
  },
  {
    key: "gossamer",
    match: ["gossamer"],
    title: "Gossamer Scrap",
    why: "Tecido top para Ascended leve.",
    how: "Loot/salvage ou TP; refine na Tailor.",
    where: "Mapas high-level / metas → Lion's Arch para craft.",
    wpHints: ["Lion's Arch"],
    wikiQuery: "Gossamer Scrap",
    ascendedUse: true,
  },
  {
    key: "hardened-leather",
    match: ["hardened leather"],
    title: "Hardened Leather Section",
    why: "Couro top para Ascended média.",
    how: "Salvage / farm / TP; refine no Leatherworker.",
    where: "Open world high-level → crafting em Lion's Arch.",
    wpHints: ["Lion's Arch"],
    wikiQuery: "Hardened Leather Section",
    ascendedUse: true,
  },
];

export function guideForItemName(name: string): MaterialGuide | null {
  const n = name.toLowerCase();
  for (const g of MATERIAL_GUIDES) {
    if (g.match.some((m) => n.includes(m))) return g;
  }
  return null;
}

export function resolveMaterialAction(name: string): {
  guide: MaterialGuide | null;
  chatLink?: string;
  teleportLabel?: string;
  wikiUrl: string;
} {
  const guide = guideForItemName(name);
  const wikiUrl = wikiSearch(guide?.wikiQuery ?? name);
  if (!guide) {
    const wp = findNearestWaypoint([name, "Lion's Arch"]);
    return {
      guide: null,
      chatLink: wp?.waypoint.chatLink,
      teleportLabel: wp
        ? `${wp.waypoint.name} - ${wp.waypoint.mapName}`
        : undefined,
      wikiUrl,
    };
  }
  const wp = findNearestWaypoint(guide.wpHints);
  return {
    guide,
    chatLink: wp?.waypoint.chatLink,
    teleportLabel: wp
      ? `${wp.waypoint.name} - ${wp.waypoint.mapName}`
      : undefined,
    wikiUrl,
  };
}
