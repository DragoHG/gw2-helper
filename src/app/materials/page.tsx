import { ActionHints } from "@/components/ActionHints";
import { HelperChrome } from "@/components/HelperChrome";
import { ItemIcon } from "@/components/ItemIcon";
import { loadLatestSnapshot } from "@/lib/db";
import { formatGold, formatNumber } from "@/lib/format";
import {
  classifyItem,
  type ItemTier,
  TIER_ORDER,
} from "@/lib/inventory/classify";
import { resolveMaterialAction } from "@/lib/materials/guide";
import Link from "next/link";

export const dynamic = "force-dynamic";

const TIER_TITLE: Record<ItemTier, string> = {
  needed: "Precisa agora (craft / Ascended)",
  quest: "Bound / conta - não venda no TP",
  legendary: "Lendário / gifts",
  ascended: "Mats Ascended - guardar",
  common: "Comum - TP ou salvage",
  junk: "Lixo",
};

export default function MaterialsPage() {
  const snapshot = loadLatestSnapshot();

  if (!snapshot) {
    return (
      <HelperChrome
        title="Materiais"
        subtitle="Atualize sua conta para ver o que você tem na storage e como farmar o que falta para Ascended."
      />
    );
  }

  const rows = snapshot.materials
    .map((m) => {
      const item = snapshot.itemsIndex[m.id];
      const name = item?.name ?? `Material #${m.id}`;
      const action = resolveMaterialAction(name);
      const advice = classifyItem(snapshot, m.id, item);
      const price = snapshot.commercePrices?.[m.id];
      const unit = price?.sells?.unit_price ?? 0;
      return {
        id: m.id,
        name,
        icon: item?.icon,
        rarity: item?.rarity,
        count: m.count,
        unit,
        stackValue: unit * m.count,
        advice,
        how: action.guide?.how ?? advice.how,
        where: action.guide?.where,
        why: action.guide?.why ?? advice.why,
        chatLink: action.chatLink,
        teleportLabel: action.teleportLabel,
        wikiUrl: advice.wikiUrl,
        tier: advice.tier,
      };
    })
    .sort((a, b) => {
      const ta = TIER_ORDER.indexOf(a.tier);
      const tb = TIER_ORDER.indexOf(b.tier);
      if (ta !== tb) return ta - tb;
      return b.stackValue - a.stackValue;
    });

  const byTier = TIER_ORDER.map((tier) => ({
    tier,
    rows: rows.filter((r) => r.tier === tier).slice(0, tier === "common" ? 40 : 60),
  })).filter((g) => g.rows.length > 0);

  return (
    <div className="space-y-6">
      <HelperChrome
        title="Materiais"
        subtitle="Storage classificada: o que guardar (Ascended/lendário/craft), o que é bound e o que pode ir ao TP. Waypoint e wiki quando existir."
      />

      <p className="flex flex-wrap gap-3 text-sm">
        <Link href="/economy" className="neon-link hover:underline">
          Economia / TP →
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

      {byTier.map((g) => (
        <section key={g.tier} className="space-y-3">
          <h3 className="text-lg text-amber-100">{TIER_TITLE[g.tier]}</h3>
          {g.rows.map((row) => (
            <article key={row.id} className="panel p-4">
              <div className="flex flex-wrap items-start gap-3">
                <ItemIcon
                  src={row.icon}
                  alt={row.name}
                  size={40}
                  rarity={row.rarity}
                  showPlaceholder
                />
                <div className="min-w-0 flex-1 break-safe">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="text-amber-50">{row.name}</h4>
                    <p className="text-sm text-amber-200">
                      ×{formatNumber(row.count)}
                      {row.unit > 0 && (
                        <span className="ml-2 text-xs text-slate-400">
                          ~{formatGold(row.stackValue)} no TP
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="mt-1 inline-block rounded bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-cyan-200">
                    {row.advice.label}
                  </span>
                  <p className="mt-1 text-sm text-slate-400">
                    <span className="text-slate-500">Por quê: </span>
                    {row.why}
                  </p>
                  <ActionHints
                    how={row.how}
                    where={row.where}
                    teleportLabel={row.teleportLabel}
                    chatLink={row.chatLink}
                    wikiUrl={row.wikiUrl}
                    wikiLabel="Wiki do item"
                  />
                </div>
              </div>
            </article>
          ))}
        </section>
      ))}

      {rows.length === 0 && (
        <p className="text-sm text-slate-500">Storage vazia neste momento.</p>
      )}
    </div>
  );
}
