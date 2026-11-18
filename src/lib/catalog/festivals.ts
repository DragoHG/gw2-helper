/**
 * Calendário estático UTC de festivais sazonais (sem LLM).
 * Janelas aproximadas anuais - boost na timeline só dentro do intervalo.
 */

export interface FestivalWindow {
  id: string;
  name: string;
  /** Mês 1-12 */
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  matchKeys: string[];
  wikiQuery: string;
}

export const FESTIVALS: FestivalWindow[] = [
  {
    id: "halloween",
    name: "Halloween",
    startMonth: 10,
    startDay: 1,
    endMonth: 11,
    endDay: 8,
    matchKeys: ["halloween", "shadow of the mad king", "labyrinth", "mad king"],
    wikiQuery: "Halloween",
  },
  {
    id: "wintersday",
    name: "Wintersday",
    startMonth: 12,
    startDay: 10,
    endMonth: 1,
    endDay: 5,
    matchKeys: ["wintersday", "toymaker", "snowball"],
    wikiQuery: "Wintersday",
  },
  {
    id: "lunar",
    name: "Lunar New Year",
    startMonth: 1,
    startDay: 20,
    endMonth: 2,
    endDay: 20,
    matchKeys: ["lunar new year", "lunar", "firecracker"],
    wikiQuery: "Lunar New Year",
  },
  {
    id: "sab",
    name: "Super Adventure Box",
    startMonth: 4,
    startDay: 1,
    endMonth: 4,
    endDay: 30,
    matchKeys: ["super adventure", "sab", "bauble"],
    wikiQuery: "Super Adventure Box",
  },
  {
    id: "four-winds",
    name: "Festival of the Four Winds",
    startMonth: 7,
    startDay: 15,
    endMonth: 8,
    endDay: 15,
    matchKeys: ["four winds", "labyrinthine cliffs", "aspect arena"],
    wikiQuery: "Festival of the Four Winds",
  },
  {
    id: "dragon-bash",
    name: "Dragon Bash",
    startMonth: 6,
    startDay: 1,
    endMonth: 6,
    endDay: 30,
    matchKeys: ["dragon bash", "pinata"],
    wikiQuery: "Dragon Bash",
  },
];

function inWindow(now: Date, f: FestivalWindow): boolean {
  const y = now.getUTCFullYear();
  const start = Date.UTC(y, f.startMonth - 1, f.startDay);
  let end = Date.UTC(y, f.endMonth - 1, f.endDay, 23, 59, 59);
  // Wintersday cruza ano
  if (f.endMonth < f.startMonth) {
    const month = now.getUTCMonth() + 1;
    if (month <= f.endMonth) {
      const startPrev = Date.UTC(y - 1, f.startMonth - 1, f.startDay);
      end = Date.UTC(y, f.endMonth - 1, f.endDay, 23, 59, 59);
      return now.getTime() >= startPrev && now.getTime() <= end;
    }
    end = Date.UTC(y + 1, f.endMonth - 1, f.endDay, 23, 59, 59);
  }
  const t = now.getTime();
  return t >= start && t <= end;
}

export function activeFestivals(nowMs: number = Date.now()): FestivalWindow[] {
  try {
    const now = new Date(nowMs);
    return FESTIVALS.filter((f) => inWindow(now, f));
  } catch {
    return [];
  }
}

export function festivalMatchesText(
  festival: FestivalWindow,
  ...parts: string[]
): boolean {
  const blob = parts.join(" ").toLowerCase();
  return festival.matchKeys.some((k) => blob.includes(k));
}

export function isFestivalText(...parts: string[]): boolean {
  const blob = parts.join(" ").toLowerCase();
  return FESTIVALS.some((f) => f.matchKeys.some((k) => blob.includes(k)));
}
