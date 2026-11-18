"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EventTimelinePanel } from "@/components/EventTimelinePanel";
import type { EventTimeline, ScoredOccurrence } from "@/lib/events/types";

function refreshOccurrence(occ: ScoredOccurrence, now: number): ScoredOccurrence {
  const isActive = occ.startAt <= now && now < occ.endAt;
  const minutesUntilStart = Math.max(
    0,
    Math.round((occ.startAt - now) / 60_000),
  );
  const minutesLeft = isActive
    ? Math.max(0, Math.round((occ.endAt - now) / 60_000))
    : Math.max(0, Math.round((occ.endAt - occ.startAt) / 60_000));
  return { ...occ, isActive, minutesUntilStart, minutesLeft };
}

function applyClock(timeline: EventTimeline, now: number): EventTimeline {
  const map = (o: ScoredOccurrence | null) =>
    o ? refreshOccurrence(o, now) : null;
  return {
    ...timeline,
    now,
    primary: map(timeline.primary),
    bridges: timeline.bridges
      .map((o) => refreshOccurrence(o, now))
      .filter((o) => o.endAt > now),
    upcoming: timeline.upcoming
      .map((o) => refreshOccurrence(o, now))
      .filter((o) => o.endAt > now),
  };
}

function needsServerRefresh(timeline: EventTimeline, now: number): boolean {
  const primary = timeline.primary;
  if (!primary) {
    // Sem primary: refetch se o próximo cronológico acabou
    const next = [...timeline.bridges, ...timeline.upcoming]
      .filter((o) => o.endAt > now)
      .sort((a, b) => a.startAt - b.startAt)[0];
    return !next;
  }
  if (primary.endAt <= now) return true;
  if (!primary.isActive && primary.startAt <= now && primary.endAt > now) {
    return true;
  }
  return false;
}

export function LiveEventTimeline({
  initial,
  horizonHours = 8,
}: {
  initial: EventTimeline;
  horizonHours?: number;
}) {
  const [timeline, setTimeline] = useState(() =>
    applyClock(initial, Date.now()),
  );
  const [fetching, setFetching] = useState(false);
  const [lastFetchAt, setLastFetchAt] = useState(() => Date.now());
  const fetchingRef = useRef(false);
  const timelineRef = useRef(timeline);
  timelineRef.current = timeline;

  const fetchTimeline = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setFetching(true);
    try {
      const res = await fetch(`/api/events?hours=${horizonHours}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as EventTimeline;
      const now = Date.now();
      setTimeline(
        applyClock(
          {
            now: data.now ?? now,
            horizonHours: data.horizonHours ?? horizonHours,
            disclaimer: data.disclaimer,
            primary: data.primary,
            bridges: data.bridges ?? [],
            upcoming: data.upcoming ?? [],
          },
          now,
        ),
      );
      setLastFetchAt(now);
    } finally {
      fetchingRef.current = false;
      setFetching(false);
    }
  }, [horizonHours]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now();
      const prev = timelineRef.current;
      if (needsServerRefresh(prev, now)) {
        void fetchTimeline();
      }
      setTimeline(applyClock(prev, now));
    }, 1000);
    return () => window.clearInterval(id);
  }, [fetchTimeline]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void fetchTimeline();
    }, 60_000);
    return () => window.clearInterval(id);
  }, [fetchTimeline]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <p>
          Relógio ao vivo · quando a janela acaba, busca o próximo evento
          {fetching ? " · atualizando..." : ""}
        </p>
        <button
          type="button"
          onClick={() => void fetchTimeline()}
          className="rounded border border-slate-600 px-2 py-1 text-slate-300 hover:bg-slate-800"
        >
          Atualizar agora
        </button>
      </div>
      <EventTimelinePanel
        timeline={timeline}
        clockLabel={new Date(timeline.now).toLocaleTimeString()}
      />
      <p className="text-[11px] text-slate-600">
        Último sync da timeline: {new Date(lastFetchAt).toLocaleTimeString()}
      </p>
    </div>
  );
}
