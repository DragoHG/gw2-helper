export type GameMode = "pve" | "pvp" | "wvw";

export interface TokenInfo {
  id: string;
  name: string;
  permissions: string[];
}

export interface AccountInfo {
  id: string;
  name: string;
  world: number;
  created: string;
  access: string[];
  commander: boolean;
  fractal_level?: number;
  daily_ap?: number;
  monthly_ap?: number;
  /** Rank WvW (campo atual da API). */
  wvw_rank?: number;
  /** Legado - algumas docs antigas usavam objeto aninhado. */
  wvw?: { rank?: number; team_id?: number };
}

export interface CharacterCore {
  name: string;
  race: string;
  gender: string;
  profession: string;
  level: number;
  age: number;
  created: string;
  deaths: number;
  title?: number;
}

export interface EquipmentItem {
  id: number;
  slot: string;
  binding?: string;
  bound_to?: string;
  location?: string;
  upgrades?: number[];
  infusions?: number[];
  stats?: {
    id: number;
    attributes: Record<string, number>;
  };
}

export interface CharacterEquipment {
  name: string;
  equipment: EquipmentItem[];
}

export interface CharacterBuildTab {
  tab: number;
  is_active?: boolean;
  build?: {
    name?: string;
    profession?: string;
    specializations?: Array<{
      id?: number;
      traits?: number[];
    }>;
    skills?: Record<string, unknown>;
  };
}

export interface CharacterSnapshot {
  core: CharacterCore;
  equipment: EquipmentItem[];
  equipmentTabs?: unknown[];
  buildTabs?: CharacterBuildTab[];
  crafting?: Array<{ discipline: string; rating: number; active: boolean }>;
  training?: unknown[];
  heropoints?: string[];
  quests?: number[];
  recipes?: number[];
  bags?: Array<{ id: number; size: number; inventory: Array<{ id: number; count: number } | null> } | null>;
}

export interface ItemDetails {
  id: number;
  name: string;
  type: string;
  rarity: string;
  level: number;
  icon?: string;
  details?: {
    type?: string;
    weight_class?: string;
    defense?: number;
    infix_upgrade?: {
      id?: number;
      attributes?: Array<{ attribute: string; modifier: number }>;
    };
  };
  flags?: string[];
}

export interface ItemStatDetails {
  id: number;
  name: string;
  attributes: Array<{ attribute: string; multiplier?: number; value?: number }>;
}

export interface AchievementProgress {
  id: number;
  current?: number;
  max?: number;
  done: boolean;
  bits?: number[];
  repeated?: number;
  unlocked?: boolean;
}

export interface AchievementDefinition {
  id: number;
  name: string;
  description?: string;
  requirement?: string;
  locked_text?: string;
  type?: string;
  flags?: string[];
  icon?: string;
  tiers?: Array<{ count: number; points: number }>;
  rewards?: Array<{
    type: string;
    id?: number;
    count?: number;
    region?: string;
  }>;
  bits?: Array<{ type: string; id?: number; text?: string }>;
  prerequisites?: number[];
  point_cap?: number;
}

export interface AchievementCategory {
  id: number;
  name: string;
  description?: string;
  order?: number;
  icon?: string;
  achievements: number[];
}

export interface MasteryProgress {
  id: number;
  level: number;
}

export interface WalletCurrency {
  id: number;
  value: number;
}

export interface MaterialSlot {
  id: number;
  category: number;
  count: number;
}

export interface PvpStats {
  pvp_rank: number;
  pvp_rank_points: number;
  pvp_rank_rollovers: number;
  aggregate: {
    wins: number;
    losses: number;
    desertions: number;
    byes: number;
    forfeits: number;
  };
  professions?: Record<
    string,
    {
      wins: number;
      losses: number;
      desertions: number;
      byes: number;
      forfeits: number;
    }
  >;
  ladders?: Record<string, unknown>;
}

export interface AccountSnapshot {
  syncedAt: string;
  tokenInfo: TokenInfo;
  account: AccountInfo;
  characters: CharacterSnapshot[];
  bank: Array<{ id: number; count: number } | null>;
  sharedInventory: Array<{ id: number; count: number } | null>;
  materials: MaterialSlot[];
  wallet: WalletCurrency[];
  achievements: AchievementProgress[];
  masteries: MasteryProgress[];
  masteryPoints: {
    totals: Array<{ region: string; spent: number; earned: number }>;
    unlocked: number[];
  };
  legendaryArmory: Array<{ id: number; count: number }>;
  recipes: number[];
  titles: number[];
  skins: number[];
  dyes: number[];
  mounts: { types: string[]; skins: number[] };
  gliders: number[];
  minis: number[];
  finishers: number[];
  novelties: number[];
  outfits: number[];
  home: { cats: number[]; nodes: string[] };
  mapChests: string[];
  worldBosses: string[];
  dungeons: string[];
  raids: string[];
  /** Presentes só se a key/scope retornar (optional). */
  skiffs?: number[];
  jadebots?: number[];
  wizardsVault?: {
    daily?: unknown;
    weekly?: unknown;
    special?: unknown;
    listings?: unknown;
  };
  /** Nome do world (resolvido no sync via `/v2/worlds`). */
  worldName?: string;
  pvp: {
    stats: PvpStats | null;
    standings: unknown[];
    ranks: unknown[];
  };
  /** League tickets (currency 30) no momento do sync. */
  pvpLeagueTickets?: number;
  commerce?: {
    delivery?: { coins: number; items: Array<{ id: number; count: number }> };
  };
  /** Scopes detectados como ausentes (para empty states honestos). */
  missingScopes?: string[];
  itemsIndex: Record<number, ItemDetails>;
  itemStatsIndex?: Record<number, ItemStatDetails>;
  /** Nomes de títulos/skins/minis citados em achievements (não confundir com unlocks da conta). */
  titlesIndex?: Record<number, { id: number; name: string; icon?: string }>;
  skinsIndex?: Record<number, { id: number; name: string; icon?: string }>;
  minisIndex?: Record<number, { id: number; name: string; icon?: string }>;
  achievementIndex?: Record<number, AchievementDefinition>;
  achievementCategories?: AchievementCategory[];
  /** Receitas unlocked (conta + chars) com defs `/v2/recipes`. */
  recipesIndex?: Record<
    number,
    {
      id: number;
      output_item_id: number;
      output_item_count: number;
      min_rating: number;
      type?: string;
      disciplines: string[];
      flags?: string[];
      ingredients: Array<{ item_id: number; count: number }>;
      chat_link?: string;
    }
  >;
  commercePrices?: Record<
    number,
    { id: number; buys: { unit_price: number; quantity: number }; sells: { unit_price: number; quantity: number } }
  >;
}

export type Rarity =
  | "Junk"
  | "Basic"
  | "Fine"
  | "Masterwork"
  | "Rare"
  | "Exotic"
  | "Ascended"
  | "Legendary";

export const RARITY_RANK: Record<string, number> = {
  Junk: 0,
  Basic: 1,
  Fine: 2,
  Masterwork: 3,
  Rare: 4,
  Exotic: 5,
  Ascended: 6,
  Legendary: 7,
};

export const EQUIPMENT_SLOTS_PVE = [
  "Helm",
  "Shoulders",
  "Coat",
  "Gloves",
  "Leggings",
  "Boots",
  "WeaponA1",
  "WeaponA2",
  "WeaponB1",
  "WeaponB2",
  "Backpack",
  "Accessory1",
  "Accessory2",
  "Amulet",
  "Ring1",
  "Ring2",
] as const;

export const ARMOR_SLOTS = [
  "Helm",
  "Shoulders",
  "Coat",
  "Gloves",
  "Leggings",
  "Boots",
] as const;

export const WEAPON_SLOTS = [
  "WeaponA1",
  "WeaponA2",
  "WeaponB1",
  "WeaponB2",
] as const;

export const TRINKET_SLOTS = [
  "Backpack",
  "Accessory1",
  "Accessory2",
  "Amulet",
  "Ring1",
  "Ring2",
] as const;
