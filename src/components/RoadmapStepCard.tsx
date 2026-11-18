import { ActionHints } from "@/components/ActionHints";
import { ItemIcon } from "@/components/ItemIcon";
import type { RoadmapLane, RoadmapStep } from "@/lib/roadmap/types";
import Link from "next/link";

const LANE_LABEL: Record<RoadmapLane, string> = {
  now: "Agora",
  session: "Sessão",
  power: "Poder",
  mastery: "Mastery",
  achievements: "Achievement",
  story: "História",
  maps: "Mapa",
  vault: "Vault",
  craft: "Craft",
  legendaries: "Lendário",
  pvp: "PvP / WvW",
};

export function RoadmapStepCard({
  step,
  index,
}: {
  step: RoadmapStep;
  index?: number;
}) {
  return (
    <article className="timeline-rail relative panel min-w-0 p-4">
      <span className="timeline-dot" aria-hidden />
      <div className="flex items-start gap-3">
        <ItemIcon src={step.icon} alt="" size={36} />
        <div className="min-w-0 flex-1 break-safe">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {typeof index === "number" && (
              <span className="text-xs tabular-nums text-cyan-500/80">
                #{index + 1}
              </span>
            )}
            <span className="rounded bg-cyan-950/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-cyan-200 ring-1 ring-cyan-500/25">
              {LANE_LABEL[step.lane] ?? step.lane}
            </span>
          </div>
          <h3 className="text-lg text-cyan-50">{step.title}</h3>
          <p className="mt-1 text-sm text-slate-300">
            <span className="text-slate-500">Por quê: </span>
            {step.why}
          </p>
          <ActionHints
            how={step.how}
            where={step.where}
            teleportLabel={step.teleportLabel}
            chatLink={step.chatLink}
            wikiUrl={step.wikiUrl}
          />
          {step.bundleWith && step.bundleWith.length > 0 && (
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-slate-400">
              {step.bundleWith.map((b, i) => (
                <li key={`${step.id}-bundle-${i}`}>{b}</li>
              ))}
            </ul>
          )}
          {step.href && (
            <Link
              href={step.href}
              className="neon-link mt-2 inline-block text-sm hover:underline"
            >
              {step.hrefLabel ?? "Abrir"} →
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
