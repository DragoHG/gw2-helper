import { ActionHints } from "@/components/ActionHints";
import { HelperChrome } from "@/components/HelperChrome";
import { RoadmapStepCard } from "@/components/RoadmapStepCard";
import { loadLatestSnapshot } from "@/lib/db";
import { buildAccountRoadmap } from "@/lib/roadmap/build";
import type { RoadmapLane } from "@/lib/roadmap/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

const LANE_ORDER: { id: RoadmapLane; title: string; blurb: string }[] = [
  { id: "now", title: "Fazer agora", blurb: "Eventos e próximos passos imediatos." },
  { id: "session", title: "Sessão no mapa", blurb: "Vários objetivos no mesmo lugar." },
  { id: "vault", title: "Wizard's Vault", blurb: "Objetivos diários de Astral Acclaim." },
  { id: "power", title: "Poder do personagem", blurb: "Ascended, gear e progressão do foco." },
  { id: "mastery", title: "Masteries", blurb: "Próximos níveis fáceis + onde farmar XP." },
  {
    id: "achievements",
    title: "Achievements",
    blurb: "Os mais próximos de concluir na sua conta.",
  },
  { id: "story", title: "História", blurb: "Capítulos alinhados às expansões que você tem." },
  { id: "maps", title: "Mapas em foco", blurb: "Onde explorar / farmar com sentido." },
  { id: "craft", title: "Crafting", blurb: "Receitas quase prontas ou craftáveis agora." },
  {
    id: "legendaries",
    title: "Lendários",
    blurb: "Próximos passos se a conta já estiver no estágio.",
  },
  {
    id: "pvp",
    title: "PvP / WvW",
    blurb: "sPvP equalizado + World vs World (gear de mapa).",
  },
];

export default function RoadmapPage() {
  const snapshot = loadLatestSnapshot();

  if (!snapshot) {
    return (
      <HelperChrome
        title="Linha do tempo da conta"
        subtitle="Atualize a conta para montar um plano único: o que fazer agora, por quê, como, wiki e teleport."
      />
    );
  }

  const roadmap = buildAccountRoadmap(snapshot);

  return (
    <div className="space-y-8">
      <HelperChrome
        title="Linha do tempo da conta"
        subtitle={`${roadmap.stageLabel}: ${roadmap.stageSummary} Junta eventos, Vault, Ascended, masteries, achievements, história, mapas, craft e PvP num só plano - com waypoint e wiki quando existir.`}
      />

      <p className="text-sm text-slate-400">
        {roadmap.accessSummary} · {roadmap.timeline.length} passos priorizados
      </p>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/" className="neon-link hover:underline">
          Fazer agora
        </Link>
        <Link href="/story" className="neon-link hover:underline">
          História
        </Link>
        <Link href="/events" className="neon-link hover:underline">
          Eventos
        </Link>
        <Link href="/masteries" className="neon-link hover:underline">
          Masteries
        </Link>
        <Link href="/craft" className="neon-link hover:underline">
          Crafting
        </Link>
      </div>

      {roadmap.session && (
        <section className="panel-glow space-y-2 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/80">
            Sessão multiobjetivo
          </p>
          <h3 className="font-display text-xl text-cyan-50">
            {roadmap.session.mapName}
          </h3>
          <p className="text-sm text-slate-300">{roadmap.session.why}</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
            {roadmap.session.objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
          <ActionHints
            how={roadmap.session.how}
            teleportLabel={roadmap.session.teleportLabel}
            chatLink={roadmap.session.chatLink}
            wikiUrl={roadmap.session.wikiUrl}
          />
        </section>
      )}

      <section className="space-y-3">
        <h3 className="font-display text-xl text-cyan-100">Ordem sugerida</h3>
        <p className="text-sm text-slate-400">
          Do mais urgente ao que pode esperar. Copie o waypoint, cole no chat do
          jogo e clique no link.
        </p>
        <div className="space-y-3">
          {roadmap.timeline.map((step, i) => (
            <RoadmapStepCard key={step.id} step={step} index={i} />
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="font-display text-xl text-cyan-100">Por faixa</h3>
        {LANE_ORDER.map((lane) => {
          const steps = roadmap.lanes[lane.id];
          if (!steps.length) return null;
          return (
            <div key={lane.id} className="space-y-3">
              <div>
                <h4 className="text-lg text-cyan-50">{lane.title}</h4>
                <p className="text-sm text-slate-400">{lane.blurb}</p>
              </div>
              <div className="space-y-3">
                {steps.map((step) => (
                  <RoadmapStepCard key={`lane-${step.id}`} step={step} />
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
