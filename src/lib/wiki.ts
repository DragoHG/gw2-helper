/** Links de wiki (puro - seguro no client). */
export function wikiSearch(query: string): string {
  return `https://wiki.guildwars2.com/wiki/Special:Search/${encodeURIComponent(query)}`;
}

export function wikiPageGuess(name: string): string {
  return `https://wiki.guildwars2.com/wiki/${encodeURIComponent(name.replace(/ /g, "_"))}`;
}
