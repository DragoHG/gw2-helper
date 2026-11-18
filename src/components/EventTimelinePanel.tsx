import { CopyButton } from "@/components/CopyButton";
import type { EventTimeline, ScoredOccurrence } from "@/lib/events/types";
import { wikiSearch } from "@/lib/wiki";

function formatWhen(occ: ScoredOccurrence, now: number): string {
  const msUntil = occ.startAt - now;
  const msLeft = occ.endAt - now;

  if (occ.isActive || (msUntil <= 0 && msLeft > 0)) {
    const totalSec = Math.max(0, Math.floor(msLeft / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `Agora · ${m}:${String(s).padStart(2, "0")} restantes`;
  }

  const totalSec = Math.max(0, Math.floor(msUntil / 1000));
  if (totalSec < 3600) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `Em ${m}:${String(s).padStart(2, "0")}`;
  }

  const start = new Date(occ.startAt);
  const local = start.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  return `${local} · em ${hours}h${mins ? ` ${mins}m` : ""}`;
}

function roleStyles(role: ScoredOccurrence["role"]) {
  if (role === "primary") return "border-amber-700/70 bg-amber-950/35";
  if (role === "bridge") return "border-emerald-800/50 bg-emerald-950/20";
  return "border-slate-700 bg-slate-900/40";
}

function EventCard({
  occ,
  now,
  compact,
}: {
  occ: ScoredOccurrence;
  now: number;
  compact?: boolean;
}) {
  const liveActive = occ.startAt <= now && now < occ.endAt;

  return (
    <article
      className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-start sm:justify-between ${roleStyles(occ.role)}`}
    >
      <div className="min-w-0 flex-1 space-y-1 break-safe">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
            {occ.role === "primary"
              ? "Foco"
              : occ.role === "bridge"
                ? "Até lá"
                : occ.kind}
          </span>
          {liveActive && (
            <span className="rounded bg-emerald-900/60 px-1.5 py-0.5 text-[10px] uppercase text-emerald-200">
              Ao vivo (janela)
            </span>
          )}
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
            {occ.expansion}
          </span>
          <span className="font-mono text-xs text-sky-300/90">
            {formatWhen(occ, now)}
          </span>
        </div>
        <h4 className="text-lg text-amber-50 break-safe">{occ.name}</h4>
        <p className="text-sm text-slate-400 break-safe">
          {occ.groupName}
          {occ.category ? ` · ${occ.category}` : ""}
        </p>
        {!compact && occ.reasons[0] && (
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-slate-300">
            {occ.reasons.map((r) => (
              <li key={r} className="break-safe">
                {r}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex min-w-0 w-full max-w-full flex-wrap items-center gap-2 sm:w-auto sm:max-w-[14rem] sm:flex-col sm:items-end">
        {occ.chatLink ? (
          <>
            <CopyButton text={occ.chatLink} label="Copiar waypoint" />
            <span className="max-w-full break-all font-mono text-[11px] text-sky-300/80">
              {occ.chatLink}
            </span>
          </>
        ) : (
          <span className="text-xs text-slate-500">
            Sem waypoint - use a wiki
          </span>
        )}
        <a
          href={wikiSearch(occ.wikiQuery || occ.name)}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-amber-400 hover:underline"
        >
          Wiki do evento
        </a>
      </div>
      {!compact && (
        <p className="w-full break-safe text-sm text-slate-400 sm:col-span-2">
          <span className="text-slate-500">Como: </span>
          {liveActive
            ? "Teleporte, entre no LFG (tecla W) se o mapa estiver vazio, e fique até o fim da meta/boss."
            : "Copie o waypoint, vá com alguns minutos de antecedência e prepare montaria/comida."}
        </p>
      )}
    </article>
  );
}

export function EventTimelinePanel({
  timeline,
  clockLabel,
}: {
  timeline: EventTimeline;
  clockLabel?: string;
}) {
  const { primary, bridges, upcoming, now, disclaimer, horizonHours } =
    timeline;

  // Timeline cronológica: o próximo mais recente primeiro
  const chronological = [...bridges, ...upcoming, ...(primary ? [primary] : [])]
    .filter((o, i, arr) => {
      const k = `${o.eventId}-${o.startAt}`;
      return arr.findIndex((x) => `${x.eventId}-${x.startAt}` === k) === i;
    })
    .filter((o) => o.endAt > now)
    .sort((a, b) => a.startAt - b.startAt);

  const nextSoonest = chronological[0] ?? primary;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">{disclaimer}</p>
        {clockLabel && (
          <p className="font-mono text-xs text-slate-400">Agora {clockLabel}</p>
        )}
      </div>

      {primary ? (
        <section className="space-y-2">
          <h3 className="text-sm uppercase tracking-wide text-amber-400/80">
            Próximo foco (progresso da conta)
          </h3>
          <EventCard occ={primary} now={now} />
        </section>
      ) : (
        <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <p className="text-sm text-slate-400">
            Nenhum evento prioritário claro nas próximas {horizonHours}h. Veja a
            timeline abaixo ou clique em Atualizar dados do jogo / Atualizar
            minha conta.
          </p>
        </section>
      )}

      {nextSoonest &&
        primary &&
        (nextSoonest.eventId !== primary.eventId ||
          nextSoonest.startAt !== primary.startAt) && (
          <section className="space-y-2">
            <h3 className="text-sm uppercase tracking-wide text-sky-400/80">
              Próximo na fila (mais recente no tempo)
            </h3>
            <EventCard
              occ={{ ...nextSoonest, role: "bridge" }}
              now={now}
              compact
            />
          </section>
        )}

      {bridges.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm uppercase tracking-wide text-emerald-400/80">
            Até o foco - o que vale a pena fazer
          </h3>
          <div className="grid gap-3 lg:grid-cols-2">
            {bridges
              .filter((o) => o.endAt > now)
              .sort((a, b) => a.startAt - b.startAt)
              .map((occ) => (
                <EventCard
                  key={`${occ.eventId}-${occ.startAt}`}
                  occ={occ}
                  now={now}
                  compact
                />
              ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-sm uppercase tracking-wide text-slate-400">
          Timeline · ordem do tempo (próximas {horizonHours}h)
        </h3>
        <div className="flex flex-col gap-3">
          {chronological.slice(0, 16).map((occ) => (
            <div
              key={`tl-${occ.eventId}-${occ.startAt}`}
              className="relative pl-4 before:absolute before:left-0 before:top-2 before:h-[calc(100%-0.5rem)] before:w-px before:bg-slate-700"
            >
              <span
                className={`absolute left-[-3px] top-3 h-2 w-2 rounded-full ${
                  occ.startAt <= now && now < occ.endAt
                    ? "bg-emerald-400"
                    : "bg-amber-600"
                }`}
              />
              <EventCard occ={occ} now={now} compact />
            </div>
          ))}
          {!chronological.length && (
            <p className="text-sm text-slate-500">
              Ainda sem horários de eventos. Clique em{" "}
              <strong>Atualizar dados do jogo</strong>.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
