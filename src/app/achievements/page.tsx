import { ActionHints } from "@/components/ActionHints";
import { EasyAchievementsPanel } from "@/components/EasyAchievementsPanel";
import { HelperChrome } from "@/components/HelperChrome";
import { ItemIcon } from "@/components/ItemIcon";
import { PinAchievementButton } from "@/components/PinAchievementButton";
import {
  achievementSummary,
  rankAchievements,
} from "@/lib/achievements/analyze";
import { getPinnedAchievementIds, loadLatestSnapshot } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AchievementsPage() {
  const snapshot = loadLatestSnapshot();
  if (!snapshot) {
    return (
      <HelperChrome
        title="Achievements"
        subtitle="Atualize a conta para ver o que falta, por que é fácil agora, wiki e teleport do próximo passo."
      />
    );
  }

  const summary = achievementSummary(snapshot);
  const pinnedIdList = getPinnedAchievementIds();
  const pinnedIds = new Set(pinnedIdList);
  const topFive = rankAchievements(snapshot, {
    mode: "pve",
    limit: 5,
    minPct: 0.05,
  });
  const easiest = rankAchievements(snapshot, {
    mode: "pve",
    limit: 30,
    minPct: 0.05,
  });
  const pinned = easiest.filter((a) => pinnedIds.has(a.id));
  const pinnedExtra = rankAchievements(snapshot, {
    mode: "any",
    limit: 200,
    minPct: 0,
  }).filter((a) => pinnedIds.has(a.id) && !pinned.some((p) => p.id === a.id));
  const allPinned = [...pinned, ...pinnedExtra];

  return (
    <div className="space-y-8">
      <HelperChrome
        title="Achievements"
        subtitle="Lista o que falta na conta, por que é fácil agora, o próximo passo (bit), wiki e teleport. Bits iguais (ex.: Text) são passos distintos - use o ícone/ordem."
      />

      <p className="flex flex-wrap gap-3 text-sm">
        <Link href="/story" className="neon-link hover:underline">
          História
        </Link>
        <Link href="/events" className="neon-link hover:underline">
          Eventos
        </Link>
        <Link href="/roadmap" className="neon-link hover:underline">
          Linha do tempo
        </Link>
      </p>

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Completos" value={`${summary.done}/${summary.total}`} />
        <Stat label="Em progresso" value={String(summary.inProgress)} />
        <Stat
          label="Mais fácil agora"
          value={topFive[0]?.name ?? "-"}
          sub={
            topFive[0]
              ? `${topFive[0].current}/${topFive[0].max} - faltam ${topFive[0].remaining}`
              : undefined
          }
        />
      </section>

      <EasyAchievementsPanel items={topFive} pinnedIds={pinnedIdList} />

      {allPinned.length > 0 && (
        <AchievementTable
          title="Fixados (seu foco)"
          tone="amber"
          items={allPinned}
          pinnedIds={pinnedIds}
        />
      )}

      <AchievementTable
        title="Mais fáceis (PvE)"
        tone="emerald"
        items={easiest}
        pinnedIds={pinnedIds}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 truncate text-lg text-amber-50">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function ProgressBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  return (
    <div className="mt-3">
      <div className="mb-1 flex justify-between text-xs text-slate-400">
        <span>
          {current}/{max}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-slate-800">
        <div className="h-full rounded bg-amber-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function AchievementTable({
  title,
  items,
  tone,
  pinnedIds,
}: {
  title: string;
  items: ReturnType<typeof rankAchievements>;
  tone: "emerald" | "amber" | "sky";
  pinnedIds: Set<number>;
}) {
  const titleColor =
    tone === "emerald"
      ? "text-emerald-300"
      : tone === "sky"
        ? "text-sky-300"
        : "text-amber-300";

  return (
    <section className="space-y-3">
      <h3 className={`text-lg ${titleColor}`}>{title}</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-lg border border-slate-700 bg-slate-900/40 p-4"
          >
            <div className="flex flex-wrap items-start gap-3">
              <ItemIcon src={item.icon} alt="" size={36} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="text-amber-50">{item.name}</h4>
                  <span className="text-sm text-amber-200">
                    {item.current}/{item.max} - faltam {item.remaining}
                  </span>
                </div>
                <ProgressBar current={item.current} max={item.max} />
                <ul className="mt-2 space-y-1">
                  {(item.nextBitIcons?.length
                    ? item.nextBitIcons
                    : item.nextBits.map((label) => ({ label }))
                  )
                    .slice(0, 4)
                    .map((bit, bitIndex) => (
                      <li
                        key={`${item.id}-bit-${bitIndex}-${bit.label}`}
                        className="flex items-center gap-2 text-sm text-slate-300"
                      >
                        <ItemIcon
                          src={
                            "icon" in bit
                              ? (bit.icon as string | undefined)
                              : undefined
                          }
                          alt=""
                          size={18}
                        />
                        <span>{bit.label}</span>
                      </li>
                    ))}
                </ul>
                <ActionHints
                  how={item.whyEasy}
                  where={
                    item.nextBits[0]
                      ? `Próximo passo: ${item.nextBits[0]}`
                      : item.requirement || undefined
                  }
                  teleportLabel={item.teleportLabel}
                  chatLink={item.chatLink}
                  wikiUrl={item.wikiUrl}
                />
                <div className="mt-2">
                  <PinAchievementButton
                    id={item.id}
                    pinned={pinnedIds.has(item.id)}
                  />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
