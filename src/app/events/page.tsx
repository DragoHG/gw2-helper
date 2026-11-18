import { ActionHints } from "@/components/ActionHints";
import { HelperChrome } from "@/components/HelperChrome";
import { LiveEventTimeline } from "@/components/LiveEventTimeline";
import { loadLatestSnapshot } from "@/lib/db";
import { buildEventTimeline } from "@/lib/events/timeline";
import { buildMapSessions } from "@/lib/sessions/map-session";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function EventsPage() {
  const snapshot = loadLatestSnapshot();

  if (!snapshot) {
    return (
      <HelperChrome
        title="Eventos"
        subtitle="Atualize a conta e os mapas para ver world bosses e metas com horário e waypoint."
      />
    );
  }

  const timeline = buildEventTimeline(snapshot, { horizonHours: 8 });
  const sessions = buildMapSessions(snapshot, { limit: 3 });

  return (
    <div className="space-y-6">
      <HelperChrome
        title="Eventos · o que fazer agora"
        subtitle="Foco no que falta no seu progresso. Quando a janela acaba, o próximo sobe sozinho. Copie o waypoint, cole no chat do jogo e vá."
      />

      {sessions.length > 0 && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h3 className="text-lg text-violet-100">
              Sessões: vários objetivos no mesmo mapa
            </h3>
            <Link href="/masteries" className="text-sm text-amber-400 hover:underline">
              Masteries →
            </Link>
          </div>
          {sessions.map((s) => (
            <article
              key={s.mapId}
              className="rounded-lg border border-violet-800/40 bg-violet-950/20 p-4"
            >
              <h4 className="text-amber-50">
                {s.mapName}
                {s.eventBoost ? " · evento perto" : ""}
              </h4>
              <p className="mt-1 text-sm text-slate-300">{s.why}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                {s.objectives.map((o) => (
                  <li key={o.id}>{o.label}</li>
                ))}
              </ul>
              <ActionHints
                how={s.how}
                teleportLabel={s.teleportLabel}
                chatLink={s.chatLink}
                wikiUrl={s.wikiUrl}
              />
            </article>
          ))}
        </section>
      )}

      <LiveEventTimeline initial={timeline} horizonHours={8} />
    </div>
  );
}
