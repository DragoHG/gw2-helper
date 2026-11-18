"use client";

import { useState, type ReactNode } from "react";
import { CopyButton } from "@/components/CopyButton";
import { ItemIcon } from "@/components/ItemIcon";
import { PinAchievementButton } from "@/components/PinAchievementButton";
import type { RankedAchievement } from "@/lib/achievements/analyze";

export function EasyAchievementsPanel({
  items,
  pinnedIds,
}: {
  items: RankedAchievement[];
  pinnedIds: number[];
}) {
  const pinned = new Set(pinnedIds);
  const top = items.slice(0, 5);
  const [openId, setOpenId] = useState<number | null>(top[0]?.id ?? null);
  const [showAll, setShowAll] = useState(false);

  if (!top.length) {
    return (
      <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-5">
        <p className="text-sm text-slate-400">
          Nenhum achievement fácil em progresso agora. Jogue um pouco (metas,
          world bosses, exploração) e atualize a conta.
        </p>
      </section>
    );
  }

  const visible = showAll ? top : top.slice(0, 1);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-amber-400/80">
            Agora · mais fáceis de concluir
          </p>
          <h3 className="mt-1 text-xl text-amber-50">
            {showAll ? "Top 5 mais fáceis" : "Próximo mais fácil"}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAll((v) => !v);
            if (!showAll) setOpenId(top[0]?.id ?? null);
          }}
          className="rounded border border-amber-800/60 bg-amber-950/40 px-3 py-1.5 text-xs text-amber-100 hover:bg-amber-900/50"
        >
          {showAll ? "Mostrar só o 1º" : "Ver detalhes dos 5 mais fáceis"}
        </button>
      </div>

      <div className="space-y-3">
        {visible.map((item, index) => {
          const open = openId === item.id || (!showAll && index === 0);
          return (
            <article
              key={item.id}
              className={`rounded-xl border p-4 ${
                index === 0
                  ? "border-amber-800/60 bg-amber-950/30"
                  : "border-slate-700 bg-slate-900/50"
              }`}
            >
              <button
                type="button"
                className="flex w-full flex-wrap items-start justify-between gap-3 text-left"
                onClick={() => setOpenId(open ? null : item.id)}
                aria-expanded={open}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ItemIcon src={item.icon} alt="" size={28} />
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                      #{index + 1}
                    </span>
                    {item.categoryName && (
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                        {item.categoryName}
                      </span>
                    )}
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase text-slate-400">
                      {item.mode}
                    </span>
                  </div>
                  <h4 className="mt-1 text-lg text-amber-50">{item.name}</h4>
                  <p className="mt-1 text-sm text-slate-300">{item.whyEasy}</p>
                </div>
                <div className="text-right text-sm text-amber-200">
                  <p>
                    {item.current}/{item.max}
                  </p>
                  <p className="text-xs text-slate-400">
                    faltam {item.remaining}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {open ? "ocultar detalhes ▲" : "ver detalhes ▼"}
                  </p>
                </div>
              </button>

              <ProgressBar current={item.current} max={item.max} />

              {open && (
                <div className="mt-4 space-y-3 border-t border-slate-800 pt-4">
                  {item.requirement && (
                    <Detail label="Objetivo">
                      <p className="text-sm text-slate-200">{item.requirement}</p>
                    </Detail>
                  )}
                  {item.description && (
                    <Detail label="Descrição">
                      <p className="text-sm text-slate-300">{item.description}</p>
                    </Detail>
                  )}
                  <Detail label="Por que é fácil agora">
                    <p className="text-sm text-slate-200">{item.whyEasy}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {item.beginnerTip}
                    </p>
                  </Detail>
                  {item.nextBits.length > 0 && (
                    <Detail label="Próximos passos (faltando)">
                      <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-slate-200">
                        {(item.nextBitIcons?.length
                          ? item.nextBitIcons
                          : item.nextBits.map((label) => ({ label }))
                        ).map((bit) => (
                          <li
                            key={bit.label}
                            className="flex items-center gap-2"
                          >
                            <ItemIcon
                              src={
                                "icon" in bit
                                  ? (bit.icon as string | undefined)
                                  : undefined
                              }
                              alt=""
                              size={20}
                            />
                            <span>{bit.label}</span>
                          </li>
                        ))}
                      </ol>
                    </Detail>
                  )}
                  {item.rewardsSummary.length > 0 && (
                    <Detail label="Recompensas">
                      <p className="text-sm text-slate-300">
                        {item.rewardsSummary.join(" · ")}
                      </p>
                    </Detail>
                  )}
                  <Detail label="Teleport sugerido (passo atual)">
                    {item.chatLink ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <CopyButton
                          text={item.chatLink}
                          label="Copiar teleport"
                        />
                        <span className="max-w-full break-all font-mono text-xs text-sky-300">
                          {item.chatLink}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Sem waypoint claro para este passo (pode ser contador
                        genérico ou local sem mapa). Use a wiki abaixo ou
                        atualize mapas e eventos.
                      </p>
                    )}
                    {item.teleportLabel && (
                      <p className="mt-1 text-sm text-sky-200">
                        {item.teleportLabel}
                        {item.teleportReason
                          ? ` · ${item.teleportReason}`
                          : ""}
                      </p>
                    )}
                  </Detail>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <PinAchievementButton
                      id={item.id}
                      pinned={pinned.has(item.id)}
                    />
                    <a
                      href={item.wikiUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded bg-slate-800 px-2 py-1 text-xs text-amber-200 hover:bg-slate-700"
                    >
                      Wiki do achievement
                    </a>
                    {item.objectiveWikiUrl && (
                      <a
                        href={item.objectiveWikiUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded bg-slate-800 px-2 py-1 text-xs text-sky-200 hover:bg-slate-700"
                      >
                        Wiki do próximo passo
                      </a>
                    )}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-1">{children}</div>
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
        <div
          className="h-full rounded bg-amber-600"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
