import {
  getApiKey,
  gw2Fetch,
  gw2FetchMany,
  gw2FetchOptional,
} from "@/lib/gw2/client";
import type {
  AccountInfo,
  AccountSnapshot,
  AchievementCategory,
  AchievementDefinition,
  AchievementProgress,
  CharacterCore,
  CharacterSnapshot,
  EquipmentItem,
  ItemDetails,
  ItemStatDetails,
  MasteryProgress,
  MaterialSlot,
  PvpStats,
  TokenInfo,
  WalletCurrency,
} from "@/lib/gw2/types";

function collectItemIds(snapshotParts: {
  characters: CharacterSnapshot[];
  bank: Array<{ id: number; count: number } | null>;
  sharedInventory: Array<{ id: number; count: number } | null>;
  materials: MaterialSlot[];
  legendaryArmory: Array<{ id: number; count: number }>;
}): number[] {
  const ids = new Set<number>();

  const add = (id?: number | null) => {
    if (id && id > 0) ids.add(id);
  };

  for (const slot of snapshotParts.bank) add(slot?.id);
  for (const slot of snapshotParts.sharedInventory) add(slot?.id);
  for (const mat of snapshotParts.materials) add(mat.id);
  for (const leg of snapshotParts.legendaryArmory) add(leg.id);

  for (const character of snapshotParts.characters) {
    for (const eq of character.equipment) {
      add(eq.id);
      eq.upgrades?.forEach(add);
      eq.infusions?.forEach(add);
    }
    for (const bag of character.bags ?? []) {
      if (!bag) continue;
      add(bag.id);
      for (const item of bag.inventory ?? []) add(item?.id);
    }
  }

  return [...ids];
}

async function fetchCharacter(name: string, apiKey: string): Promise<CharacterSnapshot> {
  const encoded = encodeURIComponent(name);
  // core precisa de characters; equipment precisa builds+inventories - optional para não quebrar key parcial
  const [
    core,
    equipment,
    equipmentTabs,
    buildTabs,
    crafting,
    training,
    heropoints,
    quests,
    recipes,
    inventory,
  ] = await Promise.all([
    gw2FetchOptional<CharacterCore>(`/characters/${encoded}/core`, { apiKey }),
    gw2FetchOptional<{ equipment: EquipmentItem[] } | EquipmentItem[]>(
      `/characters/${encoded}/equipment`,
      { apiKey },
    ),
    gw2FetchOptional<unknown[]>(`/characters/${encoded}/equipmenttabs`, {
      apiKey,
      params: { tabs: "all" },
    }),
    gw2FetchOptional<CharacterSnapshot["buildTabs"]>(
      `/characters/${encoded}/buildtabs`,
      { apiKey, params: { tabs: "all" } },
    ),
    gw2FetchOptional<CharacterSnapshot["crafting"]>(
      `/characters/${encoded}/crafting`,
      { apiKey },
    ),
    gw2FetchOptional<unknown[]>(`/characters/${encoded}/training`, { apiKey }),
    gw2FetchOptional<string[]>(`/characters/${encoded}/heropoints`, { apiKey }),
    gw2FetchOptional<number[]>(`/characters/${encoded}/quests`, { apiKey }),
    gw2FetchOptional<number[]>(`/characters/${encoded}/recipes`, { apiKey }),
    gw2FetchOptional<{
      bags: CharacterSnapshot["bags"];
    }>(`/characters/${encoded}/inventory`, { apiKey }),
  ]);

  const equipmentList = Array.isArray(equipment)
    ? equipment
    : equipment && typeof equipment === "object" && "equipment" in equipment
      ? ((equipment as { equipment?: EquipmentItem[] }).equipment ?? [])
      : [];

  const craftingList = Array.isArray(crafting)
    ? crafting
    : crafting &&
        typeof crafting === "object" &&
        Array.isArray((crafting as { crafting?: unknown }).crafting)
      ? ((crafting as { crafting: CharacterSnapshot["crafting"] }).crafting ??
        undefined)
      : undefined;

  const fallbackCore: CharacterCore = {
    name,
    race: "Unknown",
    gender: "Unknown",
    profession: "Unknown",
    level: 0,
    age: 0,
    created: new Date(0).toISOString(),
    deaths: 0,
  };

  return {
    core: core ?? fallbackCore,
    equipment: equipmentList,
    equipmentTabs: equipmentTabs ?? undefined,
    buildTabs: buildTabs ?? undefined,
    crafting: craftingList,
    training: training ?? undefined,
    heropoints: heropoints ?? undefined,
    quests: quests ?? undefined,
    recipes: recipes ?? undefined,
    bags: inventory?.bags ?? undefined,
  };
}

export async function syncAccount(): Promise<AccountSnapshot> {
  const apiKey = getApiKey();
  const syncedAt = new Date().toISOString();

  const [
    tokenInfo,
    account,
    characterNames,
    bank,
    sharedInventory,
    materials,
    wallet,
    achievements,
    masteries,
    masteryPoints,
    legendaryArmory,
    recipes,
    titles,
    skins,
    dyes,
    mountTypes,
    mountSkins,
    gliders,
    minis,
    finishers,
    novelties,
    outfits,
    homeCats,
    homeNodes,
    mapChests,
    worldBosses,
    dungeons,
    raids,
    pvpStats,
    pvpStandings,
    pvpRanks,
    wizardsDaily,
    wizardsWeekly,
    wizardsSpecial,
    wizardsListings,
    commerceDelivery,
    skiffs,
    jadebots,
  ] = await Promise.all([
    gw2Fetch<TokenInfo>("/tokeninfo", { apiKey }),
    gw2Fetch<AccountInfo>("/account", { apiKey }),
    gw2Fetch<string[]>("/characters", { apiKey }),
    gw2FetchOptional<Array<{ id: number; count: number } | null>>("/account/bank", {
      apiKey,
    }),
    gw2FetchOptional<Array<{ id: number; count: number } | null>>(
      "/account/inventory",
      { apiKey },
    ),
    gw2FetchOptional<MaterialSlot[]>("/account/materials", { apiKey }),
    gw2FetchOptional<WalletCurrency[]>("/account/wallet", { apiKey }),
    gw2FetchOptional<AchievementProgress[]>("/account/achievements", { apiKey }),
    gw2FetchOptional<MasteryProgress[]>("/account/masteries", { apiKey }),
    gw2FetchOptional<{
      totals: Array<{ region: string; spent: number; earned: number }>;
      unlocked: number[];
    }>("/account/mastery/points", { apiKey }),
    gw2FetchOptional<Array<{ id: number; count: number }>>(
      "/account/legendaryarmory",
      { apiKey },
    ),
    gw2FetchOptional<number[]>("/account/recipes", { apiKey }),
    gw2FetchOptional<number[]>("/account/titles", { apiKey }),
    gw2FetchOptional<number[]>("/account/skins", { apiKey }),
    gw2FetchOptional<number[]>("/account/dyes", { apiKey }),
    gw2FetchOptional<string[]>("/account/mounts/types", { apiKey }),
    gw2FetchOptional<number[]>("/account/mounts/skins", { apiKey }),
    gw2FetchOptional<number[]>("/account/gliders", { apiKey }),
    gw2FetchOptional<number[]>("/account/minis", { apiKey }),
    gw2FetchOptional<number[]>("/account/finishers", { apiKey }),
    gw2FetchOptional<number[]>("/account/novelties", { apiKey }),
    gw2FetchOptional<number[]>("/account/outfits", { apiKey }),
    gw2FetchOptional<number[]>("/account/home/cats", { apiKey }),
    gw2FetchOptional<string[]>("/account/home/nodes", { apiKey }),
    gw2FetchOptional<string[]>("/account/mapchests", { apiKey }),
    gw2FetchOptional<string[]>("/account/worldbosses", { apiKey }),
    gw2FetchOptional<string[]>("/account/dungeons", { apiKey }),
    gw2FetchOptional<string[]>("/account/raids", { apiKey }),
    gw2FetchOptional<PvpStats>("/pvp/stats", { apiKey }),
    gw2FetchOptional<unknown[]>("/pvp/standings", { apiKey }),
    gw2FetchOptional<unknown[]>("/pvp/ranks", { apiKey }),
    gw2FetchOptional<unknown>("/account/wizardsvault/daily", { apiKey }),
    gw2FetchOptional<unknown>("/account/wizardsvault/weekly", { apiKey }),
    gw2FetchOptional<unknown>("/account/wizardsvault/special", { apiKey }),
    gw2FetchOptional<unknown>("/account/wizardsvault/listings", { apiKey }),
    gw2FetchOptional<{ coins: number; items: Array<{ id: number; count: number }> }>(
      "/commerce/delivery",
      { apiKey },
    ),
    gw2FetchOptional<number[]>("/account/skiffs", { apiKey }),
    gw2FetchOptional<number[]>("/account/jadebots", { apiKey }),
  ]);

  const worldInfo =
    account.world > 0
      ? await gw2FetchOptional<{ id: number; name: string }>(
          `/worlds/${account.world}`,
        )
      : null;

  const characters: CharacterSnapshot[] = [];
  for (const name of characterNames) {
    characters.push(await fetchCharacter(name, apiKey));
  }

  const materialsClean = (materials ?? []).filter((m) => m.count > 0);
  const itemIds = new Set(
    collectItemIds({
      characters,
      bank: bank ?? [],
      sharedInventory: sharedInventory ?? [],
      materials: materialsClean,
      legendaryArmory: legendaryArmory ?? [],
    }),
  );

  // Nomes da loja do Vault (qualquer season / key)
  if (Array.isArray(wizardsListings)) {
    for (const row of wizardsListings) {
      if (row && typeof row === "object" && "item_id" in row) {
        const id = Number((row as { item_id?: unknown }).item_id);
        if (Number.isFinite(id) && id > 0) itemIds.add(id);
      }
    }
  }

  // Inclui starters (current=0) para ranking independente do progresso da key
  const incompleteAchievementIds = (achievements ?? [])
    .filter((a) => !a.done && (a.max ?? 0) > 0)
    .sort((a, b) => (b.current ?? 0) - (a.current ?? 0))
    .slice(0, 250)
    .map((a) => a.id);

  const [achievementDefs, achievementCategoryIds] = await Promise.all([
    incompleteAchievementIds.length
      ? gw2FetchMany<AchievementDefinition>(
          "/achievements",
          incompleteAchievementIds,
        )
      : Promise.resolve([] as AchievementDefinition[]),
    // Sem ids a API devolve só números - precisamos dos detalhes (nome/icon)
    gw2FetchOptional<number[]>("/achievements/categories"),
  ]);

  const achievementCategories =
    achievementCategoryIds && achievementCategoryIds.length
      ? await gw2FetchMany<AchievementCategory>(
          "/achievements/categories",
          achievementCategoryIds,
        )
      : [];

  const achievementIndex: AccountSnapshot["achievementIndex"] = {};
  const titleIds = new Set<number>();
  const skinIds = new Set<number>();
  const miniIds = new Set<number>();

  for (const ach of achievementDefs) {
    achievementIndex[ach.id] = ach;
    for (const reward of ach.rewards ?? []) {
      if (reward.type === "Item" && reward.id) itemIds.add(reward.id);
      if (reward.type === "Title" && reward.id) titleIds.add(reward.id);
    }
    for (const bit of ach.bits ?? []) {
      if (bit.type === "Item" && bit.id) itemIds.add(bit.id);
      if (bit.type === "Skin" && bit.id) skinIds.add(bit.id);
      if (bit.type === "Minipet" && bit.id) miniIds.add(bit.id);
    }
  }

  // Receitas unlocked (conta + todos os chars) - defs para calculadora de craft
  const asIdList = (raw: unknown): number[] =>
    Array.isArray(raw)
      ? raw.map(Number).filter((n) => Number.isFinite(n) && n > 0)
      : [];
  const recipeIdSet = new Set<number>([
    ...asIdList(recipes),
    ...characters.flatMap((ch) => asIdList(ch.recipes)),
  ]);
  // Cap defensivo: contas com discovery massivo
  const recipeIds = [...recipeIdSet].slice(0, 2500);
  type RecipeDef = NonNullable<AccountSnapshot["recipesIndex"]>[number];
  let recipeDefs: RecipeDef[] = [];
  try {
    recipeDefs =
      recipeIds.length > 0
        ? await gw2FetchMany<RecipeDef>("/recipes", recipeIds)
        : [];
  } catch (err) {
    console.error("recipes fetch", err);
    recipeDefs = [];
  }
  if (!Array.isArray(recipeDefs)) recipeDefs = [];
  const recipesIndex: NonNullable<AccountSnapshot["recipesIndex"]> = {};
  for (const rec of recipeDefs) {
    if (!rec?.id) continue;
    recipesIndex[rec.id] = {
      ...rec,
      disciplines: Array.isArray(rec.disciplines) ? rec.disciplines : [],
      ingredients: Array.isArray(rec.ingredients) ? rec.ingredients : [],
    };
    if (rec.output_item_id) itemIds.add(rec.output_item_id);
    for (const ing of recipesIndex[rec.id].ingredients) {
      if (ing.item_id) itemIds.add(ing.item_id);
    }
  }

  const itemIdList = [...itemIds];
  const statIds = new Set<number>();
  for (const ch of characters) {
    for (const eq of ch.equipment ?? []) {
      if (eq.stats?.id) statIds.add(eq.stats.id);
    }
  }

  const [items, titleRows, skinRows, miniRows, statRows] = await Promise.all([
    gw2FetchMany<ItemDetails>("/items", itemIdList),
    titleIds.size
      ? gw2FetchMany<{ id: number; name: string; icon?: string }>(
          "/titles",
          [...titleIds],
        )
      : Promise.resolve([] as Array<{ id: number; name: string; icon?: string }>),
    skinIds.size
      ? gw2FetchMany<{ id: number; name: string; icon?: string }>(
          "/skins",
          [...skinIds],
        )
      : Promise.resolve([] as Array<{ id: number; name: string; icon?: string }>),
    miniIds.size
      ? gw2FetchMany<{ id: number; name: string; icon?: string }>(
          "/minis",
          [...miniIds],
        )
      : Promise.resolve([] as Array<{ id: number; name: string; icon?: string }>),
    statIds.size
      ? gw2FetchMany<ItemStatDetails>("/itemstats", [...statIds])
      : Promise.resolve([] as ItemStatDetails[]),
  ]);

  const itemsIndex: Record<number, ItemDetails> = {};
  for (const item of items) itemsIndex[item.id] = item;

  const titlesIndex: NonNullable<AccountSnapshot["titlesIndex"]> = {};
  for (const row of titleRows) titlesIndex[row.id] = row;

  const skinsIndex: NonNullable<AccountSnapshot["skinsIndex"]> = {};
  for (const row of skinRows) skinsIndex[row.id] = row;

  const minisIndex: NonNullable<AccountSnapshot["minisIndex"]> = {};
  for (const row of miniRows) minisIndex[row.id] = row;

  const itemStatsIndex: NonNullable<AccountSnapshot["itemStatsIndex"]> = {};
  for (const row of statRows) itemStatsIndex[row.id] = row;

  // Preços TP: inventário + ingredientes/outputs de craft.
  // /commerce/prices 404a o batch se algum id não for negociável - buscar em chunks com try.
  const commercePrices: AccountSnapshot["commercePrices"] = {};
  const priceIds = itemIdList.slice(0, 1200);
  const priceChunk = 50;
  for (let i = 0; i < priceIds.length; i += priceChunk) {
    const chunk = priceIds.slice(i, i + priceChunk);
    try {
      const batch = await gw2FetchMany<{
        id: number;
        buys: { unit_price: number; quantity: number };
        sells: { unit_price: number; quantity: number };
      }>("/commerce/prices", chunk, { chunkSize: priceChunk });
      for (const price of batch) commercePrices[price.id] = price;
    } catch {
      // fallback 1-a-1 para não perder o sync por item bound/vendor-only
      for (const id of chunk) {
        try {
          const one = await gw2FetchMany<{
            id: number;
            buys: { unit_price: number; quantity: number };
            sells: { unit_price: number; quantity: number };
          }>("/commerce/prices", [id], { chunkSize: 1 });
          for (const price of one) commercePrices[price.id] = price;
        } catch {
          /* não negociável */
        }
      }
    }
  }

  const perms = new Set(tokenInfo.permissions ?? []);
  const recommended = [
    "account",
    "characters",
    "inventories",
    "builds",
    "progression",
    "unlocks",
    "wallet",
    "pvp",
    "tradingpost",
  ] as const;
  const missingScopes = recommended.filter((s) => !perms.has(s));

  return {
    syncedAt,
    tokenInfo,
    account,
    characters,
    bank: bank ?? [],
    sharedInventory: sharedInventory ?? [],
    materials: materialsClean,
    wallet: wallet ?? [],
    achievements: achievements ?? [],
    masteries: masteries ?? [],
    masteryPoints: masteryPoints ?? { totals: [], unlocked: [] },
    legendaryArmory: legendaryArmory ?? [],
    recipes: recipes ?? [],
    titles: titles ?? [],
    skins: skins ?? [],
    dyes: dyes ?? [],
    mounts: { types: mountTypes ?? [], skins: mountSkins ?? [] },
    gliders: gliders ?? [],
    minis: minis ?? [],
    finishers: finishers ?? [],
    novelties: novelties ?? [],
    outfits: outfits ?? [],
    home: { cats: homeCats ?? [], nodes: homeNodes ?? [] },
    mapChests: mapChests ?? [],
    worldBosses: worldBosses ?? [],
    dungeons: dungeons ?? [],
    raids: raids ?? [],
    skiffs: skiffs ?? undefined,
    jadebots: jadebots ?? undefined,
    wizardsVault: {
      daily: wizardsDaily,
      weekly: wizardsWeekly,
      special: wizardsSpecial,
      listings: wizardsListings,
    },
    worldName: worldInfo?.name,
    pvp: {
      stats: pvpStats,
      standings: pvpStandings ?? [],
      ranks: pvpRanks ?? [],
    },
    pvpLeagueTickets:
      (wallet ?? []).find((c) => c.id === 30)?.value ?? undefined,
    commerce: {
      delivery: commerceDelivery ?? undefined,
    },
    missingScopes: missingScopes.length ? missingScopes : undefined,
    itemsIndex,
    itemStatsIndex,
    titlesIndex,
    skinsIndex,
    minisIndex,
    achievementIndex,
    achievementCategories: achievementCategories ?? [],
    recipesIndex,
    commercePrices,
  };
}
