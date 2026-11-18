import { ActionHints } from "@/components/ActionHints";
import { HelperChrome } from "@/components/HelperChrome";
import { PrefsBackupPanel } from "@/components/PrefsBackupPanel";
import { getStatus, loadLatestSnapshot } from "@/lib/db";
import { formatDate, formatGold, formatNumber } from "@/lib/format";
import { findNearestWaypoint } from "@/lib/geo/waypoints";
import {
  accountAccessFromSnapshot,
  expansionLabel,
} from "@/lib/gw2/access";
import { wikiSearch } from "@/lib/wiki";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AccountPage() {
  const status = getStatus();
  const snapshot = loadLatestSnapshot();

  if (!snapshot) {
    return (
      <HelperChrome
        title="Conta"
        subtitle="Atualize a conta para ver carteira, expansões e o que você já desbloqueou."
      />
    );
  }

  const access = accountAccessFromSnapshot(snapshot);
  const gold = snapshot.wallet.find((c) => c.id === 1)?.value ?? 0;
  const karma = snapshot.wallet.find((c) => c.id === 2)?.value ?? 0;
  const laurels = snapshot.wallet.find((c) => c.id === 3)?.value ?? 0;
  const gems = snapshot.wallet.find((c) => c.id === 4)?.value ?? 0;
  const la = findNearestWaypoint(["Lion's Arch"]);

  return (
    <div className="space-y-6">
      <HelperChrome
        title="Sua conta"
        subtitle={`Mundo ${snapshot.account.world} · progresso atualizado ${formatDate(status.latestSnapshot?.syncedAt)}`}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Gold", value: formatGold(gold) },
          { label: "Karma", value: formatNumber(karma) },
          { label: "Laurels", value: formatNumber(laurels) },
          { label: "Gems", value: formatNumber(gems) },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-slate-700 bg-slate-900/50 p-4"
          >
            <p className="text-xs uppercase tracking-wide text-slate-400">
              {card.label}
            </p>
            <p className="mt-1 text-xl text-amber-100">{card.value}</p>
          </div>
        ))}
      </section>

      {laurels >= 30 && (
        <section className="rounded-lg border border-amber-800/40 bg-amber-950/20 p-4">
          <h3 className="text-amber-100">Você tem Laurels suficientes</h3>
          <ActionHints
            how="Troque Laurels por amuleto/acessórios Ascended no Laurel Merchant - um dos upgrades mais fáceis do jogo."
            where="Lion's Arch - Laurel Merchant perto do waypoint central."
            teleportLabel={
              la
                ? `${la.waypoint.name} - ${la.waypoint.mapName}`
                : "Lion's Arch"
            }
            chatLink={la?.waypoint.chatLink}
            wikiUrl={wikiSearch("Laurel")}
            wikiLabel="Wiki - Laurels"
          />
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
          <h3 className="text-amber-100">O que sua conta tem</h3>
          <p className="mt-1 text-sm text-slate-300">{access.summary}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {access.displayOwned.map((label) => (
              <li
                key={label}
                className="rounded bg-emerald-900/40 px-2 py-1 text-xs text-emerald-100"
              >
                {label}
              </li>
            ))}
          </ul>
          {access.missing.length > 0 && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Sem acesso (não recomendamos este conteúdo ainda)
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {access.missing.map((id) => (
                  <li
                    key={id}
                    className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-400"
                  >
                    {expansionLabel(id)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-3 text-sm text-slate-300">
            Fractal level: {snapshot.account.fractal_level ?? "-"}
          </p>
          <p className="text-sm text-slate-300">
            Achievement points do dia: {snapshot.account.daily_ap ?? "-"} · do
            mês: {snapshot.account.monthly_ap ?? "-"}
          </p>
          <p className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link href="/events" className="text-amber-400 hover:underline">
              Eventos →
            </Link>
            <Link href="/ascended" className="text-amber-400 hover:underline">
              Ascended →
            </Link>
            <Link href="/vault" className="text-amber-400 hover:underline">
              Vault →
            </Link>
          </p>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
          <h3 className="text-amber-100">Progressão geral</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-300">
            <li>Personagens: {snapshot.characters.length}</li>
            <li>
              Achievements:{" "}
              {snapshot.achievements.filter((a) => a.done).length}/
              {snapshot.achievements.length} feitos
            </li>
            <li>Skins: {snapshot.skins.length}</li>
            <li>Dyes: {snapshot.dyes.length}</li>
            <li>Receitas: {snapshot.recipes.length}</li>
            <li>Legendary Armory: {snapshot.legendaryArmory.length}</li>
            <li>
              Montarias: {snapshot.mounts.types.join(", ") || "nenhuma ainda"}
            </li>
            <li>
              Mastery:{" "}
              {snapshot.masteryPoints.totals
                .map((t) => `${t.region} ${t.spent}/${t.earned}`)
                .join(" · ") || "-"}
            </li>
          </ul>
        </div>
      </section>

      {(snapshot.missingScopes?.length ?? 0) > 0 && (
        <section className="rounded-lg border border-amber-800/40 bg-amber-950/20 p-4 text-sm text-amber-100">
          <p>
            Algumas informações da conta não vieram completas (permissões da
            chave do jogo). Em{" "}
            <a
              href="https://account.arena.net/applications"
              target="_blank"
              rel="noreferrer"
              className="text-amber-300 underline"
            >
              account.arena.net
            </a>{" "}
            crie uma chave com todas as permissões e atualize a conta de novo.
          </p>
        </section>
      )}

      <PrefsBackupPanel />
    </div>
  );
}
