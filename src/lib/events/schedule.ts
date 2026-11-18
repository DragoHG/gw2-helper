import { loadEventSchedule } from "@/lib/catalog/store";
import type { ScheduledEventEntry } from "@/lib/catalog/types";
import type { EventOccurrence } from "@/lib/events/types";

const MS_PER_MIN = 60_000;

/** Meia-noite UTC do dia de `now`. */
export function utcMidnight(now: number): number {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Expande o pattern da wiki (minutos a partir de 00:00 UTC, repetindo o ciclo)
 * em ocorrências do segmento deste evento dentro do horizonte.
 */
export function occurrencesForEvent(
  event: ScheduledEventEntry,
  now: number,
  horizonHours: number,
): EventOccurrence[] {
  const pattern = event.pattern.filter((p) => p.durationMinutes > 0);
  if (!pattern.length) return [];

  const cycleMinutes = pattern.reduce((s, p) => s + p.durationMinutes, 0);
  if (cycleMinutes <= 0) return [];

  const segmentKey = event.id.split(":")[1];
  const horizonMs = horizonHours * 60 * MS_PER_MIN;
  const windowEnd = now + horizonMs;
  const day0 = utcMidnight(now) - 24 * 60 * MS_PER_MIN; // ontem UTC (cobre overlap)
  const out: EventOccurrence[] = [];

  for (let dayStart = day0; dayStart <= windowEnd; dayStart += 24 * 60 * MS_PER_MIN) {
    let cursor = 0;
    // Repete o pattern até preencher 24h (ou um pouco mais)
    while (cursor < 24 * 60 + cycleMinutes) {
      for (const step of pattern) {
        const startAt = dayStart + cursor * MS_PER_MIN;
        const endAt = startAt + step.durationMinutes * MS_PER_MIN;
        cursor += step.durationMinutes;

        if (String(step.segmentKey) !== String(segmentKey)) continue;
        // inclui se cruza [now - small, windowEnd]
        if (endAt < now - 5 * MS_PER_MIN) continue;
        if (startAt > windowEnd) continue;

        const isActive = startAt <= now && now < endAt;
        out.push({
          eventId: event.id,
          name: event.name,
          groupName: event.groupName,
          category: event.category,
          kind: event.kind,
          expansion: event.expansion,
          wikiQuery: event.wikiQuery,
          chatLink: event.chatLink,
          worldBossApiId: event.worldBossApiId,
          startAt,
          endAt,
          minutesUntilStart: Math.max(0, Math.round((startAt - now) / MS_PER_MIN)),
          minutesLeft: isActive
            ? Math.max(0, Math.round((endAt - now) / MS_PER_MIN))
            : step.durationMinutes,
          isActive,
        });
      }
      if (pattern.length === 0) break;
    }
  }

  // dedupe by startAt
  const seen = new Set<string>();
  return out
    .filter((o) => {
      const k = `${o.eventId}:${o.startAt}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => a.startAt - b.startAt);
}

export function allOccurrences(
  now: number,
  horizonHours: number,
  events?: ScheduledEventEntry[],
): EventOccurrence[] {
  const list = events ?? loadEventSchedule();
  const out: EventOccurrence[] = [];
  for (const event of list) {
    if (event.kind === "other") continue;
    out.push(...occurrencesForEvent(event, now, horizonHours));
  }
  return out.sort((a, b) => a.startAt - b.startAt);
}
