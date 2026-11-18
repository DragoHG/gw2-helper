import type { ExpansionId } from "@/lib/gw2/access";

export interface EliteSpec {
  name: string;
  id: number;
  expansion: ExpansionId;
}

/** Elite specs por profissão - IDs oficiais /v2/specializations. */
export const HOT_ELITES: Record<string, EliteSpec> = {
  Guardian: { name: "Dragonhunter", id: 27, expansion: "HeartOfThorns" },
  Warrior: { name: "Berserker", id: 18, expansion: "HeartOfThorns" },
  Engineer: { name: "Scrapper", id: 43, expansion: "HeartOfThorns" },
  Ranger: { name: "Druid", id: 5, expansion: "HeartOfThorns" },
  Thief: { name: "Daredevil", id: 7, expansion: "HeartOfThorns" },
  Elementalist: { name: "Tempest", id: 48, expansion: "HeartOfThorns" },
  Mesmer: { name: "Chronomancer", id: 40, expansion: "HeartOfThorns" },
  Necromancer: { name: "Reaper", id: 34, expansion: "HeartOfThorns" },
  Revenant: { name: "Herald", id: 52, expansion: "HeartOfThorns" },
};

export const POF_ELITES: Record<string, EliteSpec> = {
  Guardian: { name: "Firebrand", id: 62, expansion: "PathOfFire" },
  Warrior: { name: "Spellbreaker", id: 61, expansion: "PathOfFire" },
  Engineer: { name: "Holosmith", id: 60, expansion: "PathOfFire" },
  Ranger: { name: "Soulbeast", id: 55, expansion: "PathOfFire" },
  Thief: { name: "Deadeye", id: 58, expansion: "PathOfFire" },
  Elementalist: { name: "Weaver", id: 56, expansion: "PathOfFire" },
  Mesmer: { name: "Mirage", id: 59, expansion: "PathOfFire" },
  Necromancer: { name: "Scourge", id: 57, expansion: "PathOfFire" },
  Revenant: { name: "Renegade", id: 63, expansion: "PathOfFire" },
};

export const EOD_ELITES: Record<string, EliteSpec> = {
  Guardian: { name: "Willbender", id: 65, expansion: "EndOfDragons" },
  Warrior: { name: "Bladesworn", id: 68, expansion: "EndOfDragons" },
  Engineer: { name: "Mechanist", id: 70, expansion: "EndOfDragons" },
  Ranger: { name: "Untamed", id: 72, expansion: "EndOfDragons" },
  Thief: { name: "Specter", id: 71, expansion: "EndOfDragons" },
  Elementalist: { name: "Catalyst", id: 67, expansion: "EndOfDragons" },
  Mesmer: { name: "Virtuoso", id: 66, expansion: "EndOfDragons" },
  Necromancer: { name: "Harbinger", id: 69, expansion: "EndOfDragons" },
  Revenant: { name: "Vindicator", id: 64, expansion: "EndOfDragons" },
};

/** Visions of Eternity - SotO/JW não adicionam elites novas. */
export const VOE_ELITES: Record<string, EliteSpec> = {
  Guardian: { name: "Luminary", id: 81, expansion: "VisionsOfEternity" },
  Warrior: { name: "Paragon", id: 74, expansion: "VisionsOfEternity" },
  Engineer: { name: "Amalgam", id: 75, expansion: "VisionsOfEternity" },
  Ranger: { name: "Galeshot", id: 78, expansion: "VisionsOfEternity" },
  Thief: { name: "Antiquary", id: 77, expansion: "VisionsOfEternity" },
  Elementalist: { name: "Evoker", id: 80, expansion: "VisionsOfEternity" },
  Mesmer: { name: "Troubadour", id: 73, expansion: "VisionsOfEternity" },
  Necromancer: { name: "Ritualist", id: 76, expansion: "VisionsOfEternity" },
  Revenant: { name: "Conduit", id: 79, expansion: "VisionsOfEternity" },
};

/** Ordem de prioridade: expansão mais nova primeiro. */
export const ELITE_TABLES: Array<{
  key: string;
  label: string;
  expansion: ExpansionId;
  table: Record<string, EliteSpec>;
  impact: number;
  boost: number;
}> = [
  {
    key: "voe",
    label: "VoE",
    expansion: "VisionsOfEternity",
    table: VOE_ELITES,
    impact: 9,
    boost: 1.25,
  },
  {
    key: "eod",
    label: "EoD",
    expansion: "EndOfDragons",
    table: EOD_ELITES,
    impact: 9,
    boost: 1.2,
  },
  {
    key: "pof",
    label: "PoF",
    expansion: "PathOfFire",
    table: POF_ELITES,
    impact: 8,
    boost: 1.1,
  },
  {
    key: "hot",
    label: "HoT",
    expansion: "HeartOfThorns",
    table: HOT_ELITES,
    impact: 7,
    boost: 1.0,
  },
];

export function allEliteIds(): Set<number> {
  const ids = new Set<number>();
  for (const block of ELITE_TABLES) {
    for (const e of Object.values(block.table)) ids.add(e.id);
  }
  return ids;
}
