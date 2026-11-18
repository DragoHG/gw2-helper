import { ActionHints } from "@/components/ActionHints";
import { HelperChrome } from "@/components/HelperChrome";
import { ItemIcon } from "@/components/ItemIcon";
import { loadLatestSnapshot } from "@/lib/db";
import { planLegendaries } from "@/lib/legendaries/planner";
import { resolveAccountStage } from "@/lib/gw2/stage";
import { wikiSearch } from "@/lib/wiki";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function LegendariesPage() {
  const snapshot = loadLatestSnapshot();
  if (!snapshot) {
    return (
      <HelperChrome
        title="Lendários"
        subtitle="Atualize a conta para ver collections e o Legendary Armory."
      />
    );
  }

  const stage = resolveAccountStage(snapshot);
  const plan = planLegendaries(snapshot, 8);
  const armory = snapshot.legendaryArmory ?? [];

  return (
    <div className="space-y-6">
      <HelperChrome
        title="Lendários"
        subtitle={
          stage.showLegendaries
            ? "Próximos passos de collections e armory. Lendário é conforto (stats swap, compartilhar) - se ainda faltam Ascended, priorize Ascended primeiro."
            : "Ainda cedo para priorizar lendário. Suba Ascended e Fractals primeiro; aqui aparece o que a conta já tem."
        }
      />

      <p className="flex flex-wrap gap-3 text-sm">
        <a
          href={wikiSearch("Legendary equipment")}
          target="_blank"
          rel="noreferrer"
          className="text-amber-400 hover:underline"
        >
          Wiki - Legendary equipment
        </a>
        <Link href="/ascended" className="text-amber-400 hover:underline">
          Plano Ascended →
        </Link>
        <Link href="/materials" className="text-amber-400 hover:underline">
          Materiais →
        </Link>
      </p>

      <section className="space-y-3">
        <h3 className="text-lg text-amber-100">O que fazer agora</h3>
        {plan.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhuma collection em evidência agora. Continue Ascended/Vault e
            volte depois.
          </p>
        ) : (
          plan.map((item) => (
            <article
              key={item.id}
              className="rounded-lg border border-slate-700 bg-slate-900/40 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-amber-50">{item.title}</h4>
                {item.progress && (
                  <span className="text-xs text-slate-400">{item.progress}</span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-300">
                <span className="text-slate-400">Por quê: </span>
                {item.why}
              </p>
              <ActionHints
                how={item.how}
                teleportLabel={
                  item.chatLink ? "Waypoint sugerido" : undefined
                }
                chatLink={item.chatLink}
                wikiUrl={item.wikiUrl}
              />
            </article>
          ))
        )}
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
        <h3 className="text-amber-100">
          Legendary Armory ({armory.length})
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Itens lendários já liberados para copiar em vários personagens.
        </p>
        {armory.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Nenhum item no armory ainda - normal no começo.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {armory.map((i) => {
              const item = snapshot.itemsIndex?.[i.id];
              return (
                <li key={i.id} className="flex items-center gap-2 text-sm">
                  <ItemIcon src={item?.icon} alt="" size={28} />
                  <span className="text-slate-200">
                    {item?.name ?? `Item #${i.id}`} ×{i.count}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
