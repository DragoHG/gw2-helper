/**
 * Heurística de Living World sem ownership oficial na API.
 * Só sugerir se a conta JÁ tocou: progresso current>0 ou quest IDs conhecidos.
 * Nunca usar o texto do próprio achievement como prova de ownership.
 */

export interface LivingWorldEpisode {
  id: string;
  name: string;
  season: 1 | 2 | 3 | 4 | 5;
  keywords: string[];
  /** Quest IDs conhecidos (parcial - best effort). */
  questIds?: number[];
}

export const LW_EPISODES: LivingWorldEpisode[] = [
  {
    id: "lws2",
    name: "Living World Season 2",
    season: 2,
    keywords: ["season 2", "lws2", "dry top", "silverwastes", "tangled paths"],
  },
  {
    id: "lws3",
    name: "Living World Season 3",
    season: 3,
    keywords: [
      "season 3",
      "lws3",
      "bloodstone fen",
      "ember bay",
      "draconis",
      "siren's landing",
      "lake doric",
    ],
  },
  {
    id: "lws4",
    name: "Living World Season 4",
    season: 4,
    keywords: [
      "season 4",
      "lws4",
      "domain of istan",
      "sandswept",
      "jahai",
      "thunderhead",
      "dragonfall",
    ],
  },
  {
    id: "ibs",
    name: "The Icebrood Saga",
    season: 5,
    keywords: [
      "icebrood",
      "ibs",
      "bjora",
      "drakkar",
      "jormag",
      "whisper in the dark",
      "shadow in the ice",
      "no quarter",
      "champions",
    ],
  },
];

export function matchLivingWorldEpisode(
  text: string,
): LivingWorldEpisode | null {
  const blob = text.toLowerCase();
  for (const ep of LW_EPISODES) {
    if (ep.keywords.some((k) => blob.includes(k))) return ep;
  }
  return null;
}

/**
 * Ownership real: progresso na conta OU quest do episódio.
 * NÃO usa keywords do achievement (sempre casariam).
 */
export function accountTouchedLivingWorld(input: {
  hasProgress: boolean;
  questIds: number[];
  episode: LivingWorldEpisode | null;
}): boolean {
  if (input.hasProgress) return true;
  if (
    input.episode?.questIds?.some((id) => input.questIds.includes(id))
  ) {
    return true;
  }
  return false;
}
