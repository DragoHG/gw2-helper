import { ActionHints } from "@/components/ActionHints";
import { HelperChrome } from "@/components/HelperChrome";
import { ItemIcon } from "@/components/ItemIcon";
import { planAscendedForCharacter } from "@/lib/ascended/planner";
import { loadLatestSnapshot } from "@/lib/db";
import { getFocusedCharacter } from "@/lib/gw2/focus";
import { resolveMaterialAction } from "@/lib/materials/guide";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ROUTE_LABEL: Record<string, string> = {
  laurel: "Laurels (mais fácil)",
  craft: "Craft",
  trading_post: "Trading Post",
  fractals: "Fractals",
  mixed: "Misto",
};

export default function AscendedPage() {
  const snapshot = loadLatestSnapshot();
  if (!snapshot) {
    return (
      <HelperChrome
        title="Ascended"
        subtitle="Atualize sua conta para montar o plano de upgrades do personagem em foco."
      />
    );
  }

  const focused = getFocusedCharacter(snapshot);
  const plans = focused
    ? planAscendedForCharacter(snapshot, focused)
    : [];

  // Mats Ascended que o jogador já tem - com WP de farm
  const matHints = (snapshot.materials ?? [])
    .map((m) => {
      const item = snapshot.itemsIndex?.[m.id];
      if (!item || m.count <= 0) return null;
      const action = resolveMaterialAction(item.name);
      if (!action.guide?.ascendedUse) return null;
      return {
        id: m.id,
        name: item.name,
        icon: item.icon,
        count: m.count,
        ...action,
      };
    })
    .filter(Boolean)
    .slice(0, 8) as Array<{
    id: number;
    name: string;
    icon?: string;
    count: number;
    guide: NonNullable<ReturnType<typeof resolveMaterialAction>["guide"]>;
    chatLink?: string;
    teleportLabel?: string;
    wikiUrl: string;
  }>;

  return (
    <div className="space-y-6">
      <HelperChrome
        title="Plano Ascended"
        subtitle="Ascended é o equipamento padrão de poder no PvE open-world e fractals. Exotic já funciona - Ascended é o próximo salto. Cada slot diz por quê, como e para onde ir."
      />

      {!focused ? (
        <p className="text-slate-400">
          Escolha um personagem no topo da página para ver o plano.
        </p>
      ) : plans.length === 0 ? (
        <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-4 text-sm text-emerald-100">
          <p>
            <strong>{focused.core.name}</strong> já está Ascended+ nos slots
            principais. Próximo passo: conferir runas/sigilos e a build da elite
            no{" "}
            <a
              className="text-amber-300 underline"
              href={`https://hardstuck.gg/gw2/builds/${focused.core.profession.toLowerCase()}/`}
              target="_blank"
              rel="noreferrer"
            >
              HardStuck
            </a>
            , ou olhar{" "}
            <Link href="/legendaries" className="text-amber-300 underline">
              Lendários
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            Personagem: <strong className="text-amber-100">{focused.core.name}</strong>{" "}
            · {plans.length} slot(s) ainda abaixo de Ascended. Ordem sugerida:
            trinkets/armas primeiro, armadura depois se o gold estiver curto.
          </p>
          {plans.map((p) => (
            <article
              key={p.slot}
              className="rounded-lg border border-slate-700 bg-slate-900/50 p-4"
            >
              <div className="flex flex-wrap items-start gap-3">
                <ItemIcon src={p.currentIcon} alt={p.currentName} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg text-amber-50">{p.title}</h3>
                    <span className="rounded bg-amber-900/40 px-2 py-0.5 text-xs text-amber-100">
                      {ROUTE_LABEL[p.bestRoute] ?? p.bestRoute}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    Agora: {p.currentRarity} ({p.currentName})
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                <span className="text-slate-400">Por quê: </span>
                {p.why}
              </p>
              <ActionHints
                how={p.how}
                where={
                  p.bestRoute === "laurel"
                    ? "Lion's Arch - Laurel Merchant (perto do waypoint central)."
                    : p.bestRoute === "fractals"
                      ? "Lion's Arch - portal de Fractals / Mistlock Observatory (LFG T1)."
                      : p.bestRoute === "craft"
                        ? "Estação de crafting em Lion's Arch (ou sua capital). Disciplina 500."
                        : "Trading Post em qualquer cidade - busque o slot Ascended com o atributo da sua build (ex.: Berserker)."
                }
                teleportLabel={p.teleportHint}
                chatLink={p.chatLink}
                wikiUrl={p.wikiUrl}
                wikiLabel="Wiki deste upgrade"
              />
            </article>
          ))}
        </div>
      )}

      {matHints.length > 0 && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h3 className="text-lg text-amber-100">
              Mats Ascended que você já tem
            </h3>
            <Link href="/materials" className="text-sm text-amber-400 hover:underline">
              Ver todos os materiais →
            </Link>
          </div>
          {matHints.map((m) => (
            <article
              key={m.id}
              className="flex flex-wrap gap-3 rounded-lg border border-slate-700 bg-slate-900/40 p-3"
            >
              <ItemIcon src={m.icon} alt={m.name} size={36} />
              <div className="min-w-0 flex-1">
                <p className="text-amber-50">
                  {m.name} ×{m.count}
                </p>
                <ActionHints
                  how={m.guide.how}
                  where={m.guide.where}
                  teleportLabel={m.teleportLabel}
                  chatLink={m.chatLink}
                  wikiUrl={m.wikiUrl}
                />
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
