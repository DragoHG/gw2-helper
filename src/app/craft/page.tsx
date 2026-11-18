import { ActionHints } from "@/components/ActionHints";
import { HelperChrome } from "@/components/HelperChrome";
import { ItemIcon } from "@/components/ItemIcon";
import { analyzeCraftPlans, rarestCraftGaps } from "@/lib/craft/analyze";
import { loadLatestSnapshot } from "@/lib/db";
import { formatGold } from "@/lib/format";
import { getFocusedCharacter } from "@/lib/gw2/focus";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function CraftPage() {
  const snapshot = loadLatestSnapshot();
  if (!snapshot) {
    return (
      <HelperChrome
        title="Crafting"
        subtitle="Atualize a conta para ver o que você pode craftar com o que tem, o que falta e o preço no Trading Post."
      />
    );
  }

  const focused = getFocusedCharacter(snapshot);
  const recipeCount = Object.keys(snapshot.recipesIndex ?? {}).length;
  const craftable = analyzeCraftPlans(snapshot, {
    limit: 40,
    onlyCraftable: true,
  });
  const almost = analyzeCraftPlans(snapshot, { limit: 40 }).filter(
    (p) => !p.canCraft && p.missingCount <= 6,
  );
  const highValue = analyzeCraftPlans(snapshot, {
    limit: 30,
    minRarity: "Rare",
  });
  const gaps = rarestCraftGaps(
    [...craftable, ...almost, ...highValue],
    12,
  );

  return (
    <div className="space-y-6">
      <HelperChrome
        title="Crafting"
        subtitle="Calculadora com o que a conta já sabe craftar: estoque (materials + banco + bags), rating do personagem em foco, e preços do Trading Post (compra do que falta / venda do resultado)."
      />

      <p className="flex flex-wrap gap-3 text-sm">
        <Link href="/materials" className="text-amber-400 hover:underline">
          Materiais →
        </Link>
        <Link href="/ascended" className="text-amber-400 hover:underline">
          Ascended →
        </Link>
        <Link href="/economy" className="text-amber-400 hover:underline">
          Economia →
        </Link>
      </p>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Mini
          label="Personagem"
          value={focused?.core.name ?? "-"}
          sub={
            focused
              ? (focused.crafting ?? [])
                  .map((c) => `${c.discipline} ${c.rating}`)
                  .join(" · ") || "sem crafting"
              : undefined
          }
        />
        <Mini label="Receitas carregadas" value={String(recipeCount)} />
        <Mini label="Craftáveis agora" value={String(craftable.length)} />
        <Mini label="Quase (faltam mats)" value={String(almost.length)} />
      </section>

      {recipeCount === 0 && (
        <p className="rounded border border-amber-900/40 bg-amber-950/20 p-3 text-sm text-amber-100">
          Nenhuma receita veio nesta atualização. Confira a chave do jogo
          (permissão de unlocks) e clique em Atualizar minha conta.
        </p>
      )}

      {gaps.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg text-amber-100">
            O que mais falta (preço TP / farm)
          </h3>
          <p className="text-sm text-slate-400">
            Ingredientes em falta nos seus crafts - com valor de compra no
            Trading Post e onde dropar/farmar quando soubermos.
          </p>
          {gaps.map((g) => (
            <article
              key={g.itemId}
              className="rounded-lg border border-slate-700 bg-slate-900/40 p-3"
            >
              <div className="flex flex-wrap items-start gap-3">
                <ItemIcon src={g.icon} alt={g.name} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="text-amber-50">{g.name}</h4>
                    <p className="text-sm text-amber-200">
                      tem {g.have} · falta {g.missing}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400">
                    {g.buyUnit
                      ? `Comprar faltante ≈ ${formatGold(g.buyCostMissing ?? 0)} (unit ${formatGold(g.buyUnit)})`
                      : "Sem preço de compra no TP agora"}
                    {g.sellUnit
                      ? ` · venda unit ${formatGold(g.sellUnit)}`
                      : ""}
                  </p>
                  <ActionHints
                    how={g.how}
                    where={g.where}
                    teleportLabel={g.teleportLabel}
                    chatLink={g.chatLink}
                    wikiUrl={g.wikiUrl}
                    wikiLabel="Wiki do item"
                  />
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      <CraftSection
        title="Pode craftar agora"
        empty="Nada craftável com o estoque atual e o rating deste personagem."
        rows={craftable.slice(0, 20)}
      />
      <CraftSection
        title="Quase lá (faltam poucos mats)"
        empty="Nenhum craft quase completo no momento."
        rows={almost.slice(0, 20)}
      />
      <CraftSection
        title="Raros+ (valor / raridade)"
        empty="Sem crafts Rare+ nas receitas carregadas."
        rows={highValue.slice(0, 15)}
      />
    </div>
  );
}

function Mini({
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
      {sub && <p className="text-xs text-slate-400 line-clamp-2">{sub}</p>}
    </div>
  );
}

function CraftSection({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: ReturnType<typeof analyzeCraftPlans>;
  empty: string;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-lg text-amber-100">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">{empty}</p>
      ) : (
        rows.map((row) => (
          <article
            key={row.recipeId}
            className="rounded-lg border border-slate-700 bg-slate-900/40 p-4"
          >
            <div className="flex flex-wrap items-start gap-3">
              <ItemIcon src={row.outputIcon} alt={row.outputName} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="text-amber-50">
                    {row.outputName}
                    {row.outputCount > 1 ? ` ×${row.outputCount}` : ""}
                  </h4>
                  <span className="text-sm text-amber-200">
                    {row.canCraft ? "pronto" : `falta ${row.missingCount}`}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {row.disciplines.join(", ")} · rating {row.characterRating}/
                  {row.minRating} · {row.outputRarity}
                </p>
                <ul className="mt-2 space-y-1">
                  {row.ingredients.map((ing) => (
                    <li
                      key={ing.itemId}
                      className="flex flex-wrap items-center gap-2 text-sm text-slate-300"
                    >
                      <ItemIcon src={ing.icon} alt="" size={18} />
                      <span>
                        {ing.name} · {ing.have}/{ing.need}
                        {ing.missing > 0 ? (
                          <span className="text-amber-300">
                            {" "}
                            (falta {ing.missing}
                            {ing.buyCostMissing
                              ? ` · TP ${formatGold(ing.buyCostMissing)}`
                              : ""}
                            )
                          </span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-slate-400">
                  {row.buyMissingCost > 0
                    ? `Comprar faltantes ≈ ${formatGold(row.buyMissingCost)}`
                    : "Mats ok"}
                  {row.outputSellUnit > 0
                    ? ` · venda output ≈ ${formatGold(row.outputSellStack)}`
                    : ""}
                  {row.outputBuyUnit > 0
                    ? ` · comprar pronto ≈ ${formatGold(row.outputBuyUnit * row.outputCount)}`
                    : ""}
                </p>
                <p className="mt-1 text-sm text-slate-300">{row.craftVsBuyNote}</p>
                {row.ingredients
                  .filter((i) => i.missing > 0)
                  .slice(0, 2)
                  .map((ing) => (
                    <ActionHints
                      key={`miss-${ing.itemId}`}
                      how={ing.how}
                      where={ing.where}
                      teleportLabel={ing.teleportLabel}
                      chatLink={ing.chatLink}
                      wikiUrl={ing.wikiUrl}
                      wikiLabel={`Wiki - ${ing.name}`}
                    />
                  ))}
                <ActionHints
                  how="Vá à estação da disciplina em Lion's Arch (ou sua capital) e craft o item."
                  teleportLabel={row.stationLabel}
                  chatLink={row.stationChatLink}
                />
              </div>
            </div>
          </article>
        ))
      )}
    </section>
  );
}
