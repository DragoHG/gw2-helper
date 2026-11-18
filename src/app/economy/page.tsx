import { ActionHints } from "@/components/ActionHints";
import { HelperChrome } from "@/components/HelperChrome";
import { ItemIcon } from "@/components/ItemIcon";
import { loadCurrencies } from "@/lib/catalog/store";
import { loadLatestSnapshot } from "@/lib/db";
import { formatGold, formatNumber } from "@/lib/format";
import { findNearestWaypoint } from "@/lib/geo/waypoints";
import { wikiSearch } from "@/lib/wiki";
import { classifyItem } from "@/lib/inventory/classify";
import { resolveMaterialAction } from "@/lib/materials/guide";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function EconomyPage() {
  const snapshot = loadLatestSnapshot();
  if (!snapshot) {
    return (
      <HelperChrome
        title="Economia"
        subtitle="Atualize a conta para ver carteira, delivery do Trading Post e materiais valiosos."
      />
    );
  }

  const currencies = loadCurrencies();
  const byId = new Map(currencies.map((c) => [c.id, c]));
  const wallet = [...snapshot.wallet].sort((a, b) => b.value - a.value);
  const la = findNearestWaypoint(["Lion's Arch"]);

  const valuables = snapshot.materials
    .map((m) => {
      const item = snapshot.itemsIndex[m.id];
      const price = snapshot.commercePrices?.[m.id]?.sells?.unit_price ?? 0;
      const name = item?.name ?? `Material #${m.id}`;
      const action = resolveMaterialAction(name);
      const advice = classifyItem(snapshot, m.id, item);
      return {
        id: m.id,
        name,
        icon: item?.icon,
        rarity: item?.rarity,
        count: m.count,
        unit: price,
        stack: price * m.count,
        advice,
        ...action,
      };
    })
    .filter((v) => v.stack > 0)
    .sort((a, b) => b.stack - a.stack)
    .slice(0, 25);

  const delivery = snapshot.commerce?.delivery;

  return (
    <div className="space-y-6">
      <HelperChrome
        title="Economia"
        subtitle="Carteira, delivery do Trading Post e mats com valor - cada item diz se guardar (Ascended/lendário/craft) ou vender."
      />

      <ActionHints
        how="Guarde mats Ascended/lendários. O resto com preço no TP pode virar gold. Laurels e metas também geram recursos sem gastar Gems."
        where="Trading Post em qualquer cidade - Lion's Arch é o hub mais fácil."
        teleportLabel={
          la ? `${la.waypoint.name} - ${la.waypoint.mapName}` : undefined
        }
        chatLink={la?.waypoint.chatLink}
        wikiUrl={wikiSearch("Trading Post")}
        wikiLabel="Wiki - Trading Post"
      />

      <p className="flex flex-wrap gap-3 text-sm">
        <Link href="/materials" className="neon-link hover:underline">
          Materiais (farm/WP) →
        </Link>
        <Link href="/craft" className="neon-link hover:underline">
          Crafting →
        </Link>
        <Link href="/ascended" className="neon-link hover:underline">
          Ascended →
        </Link>
        <Link href="/roadmap" className="neon-link hover:underline">
          Linha do tempo →
        </Link>
      </p>

      {delivery && (
        <section className="panel p-4">
          <h3 className="text-amber-100">Delivery do Trading Post</h3>
          <p className="mt-1 text-sm text-slate-300">
            Moedas pendentes: {formatGold(delivery.coins)} · Itens:{" "}
            {delivery.items.length}
          </p>
          {delivery.items.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              {delivery.items.slice(0, 12).map((it) => {
                const meta = snapshot.itemsIndex[it.id];
                return (
                  <li key={it.id} className="flex items-center gap-2">
                    <ItemIcon
                      src={meta?.icon}
                      alt=""
                      size={20}
                      rarity={meta?.rarity}
                      showPlaceholder
                    />
                    <span className="break-safe">
                      {meta?.name ?? `Item #${it.id}`} ×{it.count}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-1 text-xs text-slate-500">
            Pegue no NPC do Trading Post (aba Delivery) em qualquer cidade.
          </p>
        </section>
      )}

      <section className="panel p-4">
        <h3 className="text-amber-100">Carteira</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="px-2 py-1">Moeda</th>
                <th className="px-2 py-1">Valor</th>
              </tr>
            </thead>
            <tbody>
              {wallet.map((w) => {
                const meta = byId.get(w.id);
                const label = meta?.name ?? `Moeda #${w.id}`;
                const display =
                  w.id === 1 ? formatGold(w.value) : formatNumber(w.value);
                return (
                  <tr key={w.id} className="border-t border-slate-800">
                    <td className="px-2 py-1">
                      <span className="inline-flex items-center gap-2">
                        <ItemIcon
                          src={meta?.icon}
                          alt=""
                          size={20}
                          showPlaceholder
                        />
                        {label}
                      </span>
                    </td>
                    <td className="px-2 py-1">{display}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg text-amber-100">Materiais com valor no TP</h3>
        {valuables.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhum material com preço de venda agora.
          </p>
        ) : (
          valuables.map((v) => (
            <article key={v.id} className="panel p-3">
              <div className="flex flex-wrap items-start gap-3">
                <ItemIcon
                  src={v.icon}
                  alt={v.name}
                  size={36}
                  rarity={v.rarity}
                  showPlaceholder
                />
                <div className="min-w-0 flex-1 break-safe">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="text-amber-50">{v.name}</h4>
                    <p className="text-sm text-amber-200">
                      ×{formatNumber(v.count)} · ~{formatGold(v.stack)}
                    </p>
                  </div>
                  <span className="mt-1 inline-block rounded bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-cyan-200">
                    {v.advice.label}
                  </span>
                  <p className="mt-1 text-sm text-slate-400">
                    <span className="text-slate-500">Por quê: </span>
                    {v.advice.why}
                  </p>
                  <ActionHints
                    how={v.guide?.how ?? v.advice.how}
                    where={v.guide?.where}
                    teleportLabel={v.teleportLabel}
                    chatLink={v.chatLink}
                    wikiUrl={v.advice.wikiUrl}
                  />
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
