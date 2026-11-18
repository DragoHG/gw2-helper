import { ActionHints } from "@/components/ActionHints";
import type { Recommendation } from "@/lib/recommend/types";

const PRIORITY_LABEL: Record<string, string> = {
  critical: "prioridade alta",
  high: "importante",
  medium: "vale a pena",
  low: "quando sobrar tempo",
};

export function RecommendationCard({ rec }: { rec: Recommendation }) {
  const chatLink =
    typeof rec.meta?.chatLink === "string" ? rec.meta.chatLink : undefined;
  const teleportLabel =
    typeof rec.meta?.teleportLabel === "string"
      ? rec.meta.teleportLabel
      : undefined;
  const wiki = rec.links?.find(
    (l) => l.href.includes("wiki") || l.label.toLowerCase().includes("wiki"),
  );

  return (
    <article className="panel min-w-0 break-safe p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span
          className={`rounded px-2 py-0.5 text-xs uppercase tracking-wide ${
            rec.mode === "pve"
              ? "bg-emerald-900/50 text-emerald-200 ring-1 ring-emerald-500/30"
              : rec.category === "wvw"
                ? "bg-amber-900/45 text-amber-100 ring-1 ring-amber-500/30"
                : "bg-sky-900/50 text-sky-200 ring-1 ring-sky-500/30"
          }`}
        >
          {rec.mode === "pve"
            ? "PvE"
            : rec.category === "wvw"
              ? "WvW"
              : "sPvP"}
        </span>
        {rec.priority && (
          <span
            className={`rounded px-2 py-0.5 text-xs ${
              rec.priority === "critical"
                ? "bg-red-900/50 text-red-200"
                : rec.priority === "high"
                  ? "bg-amber-900/40 text-amber-100"
                  : "bg-slate-800 text-slate-300"
            }`}
          >
            {PRIORITY_LABEL[rec.priority] ?? rec.priority}
          </span>
        )}
      </div>
      <h3 className="text-lg text-cyan-50">{rec.title}</h3>
      {rec.character && (
        <p className="mt-1 text-xs text-slate-400">
          Personagem: {rec.character}
        </p>
      )}
      <p className="mt-2 text-sm text-slate-300">
        <span className="text-slate-500">Por quê: </span>
        {rec.why}
      </p>
      <ActionHints
        how={rec.how}
        teleportLabel={teleportLabel}
        chatLink={chatLink}
        wikiUrl={wiki?.href}
        wikiLabel={wiki?.label ?? "Wiki"}
      />
      <div className="mt-2 flex flex-wrap gap-3">
        {rec.links
          ?.filter((l) => l !== wiki)
          .map((link) => {
            const internal = link.href.startsWith("/");
            return (
              <a
                key={link.href}
                href={link.href}
                {...(internal ? {} : { target: "_blank", rel: "noreferrer" })}
                className="neon-link text-sm hover:underline"
              >
                {link.label}
              </a>
            );
          })}
      </div>
    </article>
  );
}
