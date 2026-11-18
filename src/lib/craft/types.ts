export interface RecipeDefinition {
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

export interface CraftIngredientNeed {
  itemId: number;
  name: string;
  icon?: string;
  need: number;
  have: number;
  missing: number;
  buyUnit?: number;
  sellUnit?: number;
  buyCostMissing?: number;
  /** Como/onde farmar se faltar */
  how?: string;
  where?: string;
  chatLink?: string;
  teleportLabel?: string;
  wikiUrl?: string;
}

export interface CraftPlanRow {
  recipeId: number;
  outputItemId: number;
  outputName: string;
  outputIcon?: string;
  outputCount: number;
  outputRarity: string;
  disciplines: string[];
  minRating: number;
  characterRating: number;
  canCraft: boolean;
  missingCount: number;
  ingredients: CraftIngredientNeed[];
  buyMissingCost: number;
  outputSellUnit: number;
  outputBuyUnit: number;
  outputSellStack: number;
  craftVsBuy: "craft_cheaper" | "buy_cheaper" | "unknown";
  craftVsBuyNote: string;
  easeScore: number;
  chatLink?: string;
  stationChatLink?: string;
  stationLabel?: string;
}
