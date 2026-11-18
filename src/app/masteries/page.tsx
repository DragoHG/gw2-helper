import { ActionHints } from "@/components/ActionHints";
import { HelperChrome } from "@/components/HelperChrome";
import { ItemIcon } from "@/components/ItemIcon";
import { loadMasteries } from "@/lib/catalog/store";
import { loadLatestSnapshot } from "@/lib/db";
import {
  masteryRegionSummaries,
  rankMasterySteps,
} from "@/lib/masteries/analyze";
import { buildMapSessions } from "@/lib/sessions/map-session";
import { formatNumber } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function MasteriesPage() {
  const snapshot = loadLatestSnapshot();
  const catalogTracks = loadMasteries();

  if (!snapshot) {
    return (
      <HelperChrome
        title="Masteries"
        subtitle="Atualize a conta para ver quais tracks estão mais fáceis de concluir e onde farmar XP."
      />
    );
  }

  if (!catalogTracks.length) {
    return (
      <div className="space-y-4">
        <HelperChrome
          title="Masteries"
          subtitle="Falta o catálogo de tracks do jogo."
        />
        <p className="text-sm text-slate-400">
          Clique em <strong>Atualizar dados do jogo</strong> para baixar as
          tracks de mastery, depois atualize a conta.
        </p>
      </div>
    );
  }

  const steps = rankMasterySteps(snapshot, { limit: 16 });
  const regions = masteryRegionSummaries(snapshot);
  const sessions = buildMapSessions(snapshot, { limit: 3 }).filter((s) =>
    s.objectives.some((o) => o.kind === "mastery"),
  );

  return (
    <div className="space-y-6">
      <HelperChrome
        title="Masteries"
        subtitle="Prioriza o próximo nível mais fácil da sua conta (pontos livres + utilidade). A API não mostra a barra de XP - o guia abaixo diz onde farmar XP da região."
      />

      <p className="flex flex-wrap gap-3 text-sm">
        <Link href="/story" className="neon-link hover:underline">
          História
        </Link>
        <Link href="/events" className="neon-link hover:underline">
          Eventos (XP em meta)
        </Link>
        <Link href="/achievements" className="neon-link hover:underline">
          Achievements
        </Link>
      </p>

      {regions.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {regions.map((r) => (
            <div
              key={r.region}
              className="rounded-lg border border-slate-700 bg-slate-900/50 p-4"
            >
              <p className="text-xs uppercase tracking-wide text-slate-400">
                {r.region}
              </p>
              <p className="mt-1 text-lg text-amber-50">
                {r.free} livre(s)
              </p>
              <p className="text-xs text-slate-400">
                {r.spent}/{r.earned} gastos · {r.tracksOpen} track(s) abertas ·{" "}
                {r.tracksDone} completas
              </p>
            </div>
          ))}
        </section>
      )}

      {sessions.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg text-sky-200">Sessões que incluem mastery</h3>
          {sessions.map((s) => (
            <article
              key={s.mapId}
              className="rounded-lg border border-sky-800/40 bg-sky-950/20 p-4"
            >
              <h4 className="text-amber-50">
                {s.mapName} · {s.objectives.length} objetivos
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

      <section className="space-y-3">
        <h3 className="text-lg text-amber-100">Mais fáceis de concluir agora</h3>
        {steps.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhuma track aberta com a expansão desta conta - ou tudo já está
            completo nas regiões liberadas.
          </p>
        ) : (
          steps.map((step) => (
            <article
              key={`${step.trackId}-${step.nextLevelIndex}`}
              className="rounded-lg border border-slate-700 bg-slate-900/40 p-4"
            >
              <div className="flex flex-wrap items-start gap-3">
                <ItemIcon src={step.nextIcon} alt="" size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="text-amber-50">
                      {step.trackName} → {step.nextLevelName}
                    </h4>
                    <span className="text-sm text-amber-200">
                      {step.pointCost} pt ·{" "}
                      {formatNumber(step.expCost)} XP
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {step.region} · {step.levelsDone}/{step.levelsTotal} ·{" "}
                    {step.canAffordPoints
                      ? "pontos OK"
                      : `livres ${step.pointsFree}`}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    <span className="text-slate-400">Por quê: </span>
                    {step.whyEasy}
                  </p>
                  {step.instruction && (
                    <p className="mt-1 text-sm text-slate-400">
                      {step.instruction}
                    </p>
                  )}
                  <ActionHints
                    how={step.how}
                    where={step.where}
                    teleportLabel={step.teleportLabel}
                    chatLink={step.chatLink}
                    wikiUrl={step.wikiUrl}
                  />
                  <div className="mt-3 rounded border border-emerald-900/40 bg-emerald-950/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-emerald-300/80">
                      Como farmar XP desta região
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      {step.xpGuide.how}
                    </p>
                    <ul className="mt-1 list-disc pl-5 text-xs text-slate-400">
                      {step.xpGuide.activities.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                    <ActionHints
                      where={step.xpGuide.where}
                      teleportLabel={step.xpGuide.teleportLabel}
                      chatLink={step.xpGuide.chatLink}
                      wikiUrl={step.xpGuide.wikiUrl}
                      wikiLabel="Wiki - mastery desta região"
                    />
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
