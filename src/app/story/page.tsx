import { ActionHints } from "@/components/ActionHints";
import { HelperChrome } from "@/components/HelperChrome";
import { loadLatestSnapshot } from "@/lib/db";
import { getFocusedCharacter } from "@/lib/gw2/focus";
import { resolveAccountStage } from "@/lib/gw2/stage";
import { analyzeStoryProgress } from "@/lib/roadmap/story-guide";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function StoryPage() {
  const snapshot = loadLatestSnapshot();

  if (!snapshot) {
    return (
      <HelperChrome
        title="História"
        subtitle="Atualize a conta para ver a linha completa da story (core até VoE), com wiki e teleport."
      />
    );
  }

  const stage = resolveAccountStage(snapshot);
  const focused = getFocusedCharacter(snapshot);
  const steps = analyzeStoryProgress(snapshot);
  const owned = steps.filter((s) => s.owned).sort((a, b) => b.priority - a.priority);
  const locked = steps.filter((s) => !s.owned).sort((a, b) => a.order - b.order);
  const chronological = [...steps].sort((a, b) => a.order - b.order);
  const focus = owned[0];

  return (
    <div className="space-y-8">
      <HelperChrome
        title="História"
        subtitle={`${stage.label}: expansões + Living World (ex.: LW4 depois de Path of Fire). Story Journal (J) no jogo.`}
      />

      <p className="text-sm text-slate-400">
        {stage.access.summary}
        {focused
          ? ` - Foco: ${focused.core.name} (${focused.quests?.length ?? 0} quests na API)`
          : ""}
        {` - ${owned.length} capítulo(s) liberado(s) - ${locked.length} bloqueado(s)`}
      </p>
      <p className="text-sm text-slate-500">
        A API não marca &quot;story concluída&quot;. PoF usa montarias (Jackal) +
        achievements do tema; com isso o foco sobe para Living World Season 4.
      </p>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/roadmap" className="neon-link hover:underline">
          Linha do tempo
        </Link>
        <Link href="/achievements" className="neon-link hover:underline">
          Achievements
        </Link>
        <Link href="/events" className="neon-link hover:underline">
          Eventos
        </Link>
        <Link href="/masteries" className="neon-link hover:underline">
          Masteries
        </Link>
        <Link href="/pvp" className="neon-link hover:underline">
          PvP / WvW
        </Link>
      </div>

      {focus && (
        <section className="panel-glow space-y-2 p-4 sm:p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400/80">
            Em foco · {focus.statusLabel}
          </p>
          <h3 className="section-title text-xl">{focus.title}</h3>
          <p className="text-sm text-slate-400">{focus.expansionLabel}</p>
          <p className="text-sm text-slate-300 break-safe">{focus.why}</p>
          <ActionHints
            how={focus.how}
            where={focus.where}
            teleportLabel={focus.teleportLabel}
            chatLink={focus.chatLink}
            wikiUrl={focus.wikiUrl}
          />
          {focus.relatedAchievements.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              {focus.relatedAchievements.slice(0, 4).map((a) => (
                <li key={a.id} className="break-safe">
                  {a.done ? "Feito" : "Aberto"}: {a.name} ({a.current}/{a.max})
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="space-y-4">
        <h3 className="section-title text-lg">Linha completa (ordem do jogo)</h3>
        <p className="text-sm text-slate-400">
          Core, Living World Season 4 (com PoF) e expansões até VoE. Liberados
          usam seu progresso; bloqueados mostram o que falta na conta.
        </p>
        <div className="space-y-3">
          {chronological.map((step, i) => (
            <article
              key={step.id}
              className={`panel space-y-2 p-4 sm:p-5 ${
                step.owned ? "" : "opacity-80"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs tabular-nums text-cyan-500/80">
                  #{i + 1}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wide ring-1 ${
                    step.owned
                      ? "bg-cyan-950/60 text-cyan-200 ring-cyan-500/25"
                      : "bg-slate-900 text-slate-400 ring-slate-600/40"
                  }`}
                >
                  {step.owned ? step.statusLabel : "Bloqueado"}
                </span>
                <span className="text-xs text-slate-500">
                  {step.expansionLabel}
                </span>
              </div>
              <h4 className="text-lg text-cyan-50 break-safe">{step.title}</h4>
              <p className="text-sm text-slate-300 break-safe">{step.why}</p>
              {step.bundleWith && step.bundleWith.length > 0 && (
                <ul className="list-disc space-y-0.5 pl-5 text-xs text-slate-400">
                  {step.bundleWith.slice(0, 5).map((b, bi) => (
                    <li key={`${step.id}-b-${bi}`}>{b}</li>
                  ))}
                </ul>
              )}
              {step.owned ? (
                <>
                  <ActionHints
                    how={step.how}
                    where={step.where}
                    teleportLabel={step.teleportLabel}
                    chatLink={step.chatLink}
                    wikiUrl={step.wikiUrl}
                  />
                  {step.relatedAchievements.length > 0 && (
                    <div className="border-t border-cyan-500/10 pt-2">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Achievements no tema
                      </p>
                      <ul className="mt-1 space-y-1 text-sm text-slate-300">
                        {step.relatedAchievements.map((a) => (
                          <li key={a.id} className="break-safe">
                            <Link
                              href="/achievements"
                              className="neon-link hover:underline"
                            >
                              {a.name}
                            </Link>{" "}
                            · {a.current}/{a.max}
                            {a.done ? " (feito)" : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="flex flex-wrap gap-3 text-sm">
                    <Link href="/events" className="neon-link hover:underline">
                      Eventos no mapa
                    </Link>
                    <Link
                      href="/masteries"
                      className="neon-link hover:underline"
                    >
                      Masteries
                    </Link>
                    <Link href="/roadmap" className="neon-link hover:underline">
                      Linha do tempo
                    </Link>
                  </p>
                </>
              ) : (
                <ActionHints how={step.how} wikiUrl={step.wikiUrl} />
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
