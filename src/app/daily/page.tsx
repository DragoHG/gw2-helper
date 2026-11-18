import Link from "next/link";
import { ActionHints } from "@/components/ActionHints";
import { HelperChrome } from "@/components/HelperChrome";
import { loadLatestSnapshot } from "@/lib/db";
import { findNearestWaypoint } from "@/lib/geo/waypoints";
import { worldBossDisplayName } from "@/lib/recommend/daily-actions";
import { vaultDailySummary } from "@/lib/vault/parse";
import { resolveVaultObjective } from "@/lib/vault/guide";
import { wikiSearch } from "@/lib/wiki";

export const dynamic = "force-dynamic";

export default function DailyPage() {
  const snapshot = loadLatestSnapshot();
  if (!snapshot) {
    return (
      <HelperChrome
        title="Daily"
        subtitle="Atualize a conta para ver o checklist do dia desde o reset."
      />
    );
  }

  const wbDone = (snapshot.worldBosses ?? []).map(worldBossDisplayName);
  const chests = snapshot.mapChests ?? [];
  const dungeons = snapshot.dungeons ?? [];
  const raids = snapshot.raids ?? [];
  const vault = vaultDailySummary(snapshot);
  const la = findNearestWaypoint(["Lion's Arch"]);

  return (
    <div className="space-y-6">
      <HelperChrome
        title="Rotina diária"
        subtitle="O que já foi feito desde o reset UTC. Para o próximo world boss/meta com horário e teleport, use Eventos."
      />
      <p className="flex flex-wrap gap-3 text-sm">
        <Link href="/events" className="text-amber-400 hover:underline">
          Timeline de eventos →
        </Link>
        <Link href="/vault" className="text-amber-400 hover:underline">
          Wizard&apos;s Vault →
        </Link>
      </p>

      <section className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
        <h3 className="text-amber-100">Comece aqui</h3>
        <ActionHints
          how="Teleporte para Lion's Arch, abra o LFG (tecla W), faça o Wizard's Vault do dia e, se estiver no 80, 1-3 fractals T1."
          where="Lion's Arch - hub de TP, Fractals e vendors."
          teleportLabel={
            la ? `${la.waypoint.name} - ${la.waypoint.mapName}` : undefined
          }
          chatLink={la?.waypoint.chatLink}
          wikiUrl={wikiSearch("Daily")}
          wikiLabel="Wiki - dailies"
        />
      </section>

      {vault && (
        <section className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h3 className="text-emerald-100">Wizard&apos;s Vault · hoje</h3>
            <Link href="/vault" className="text-sm text-amber-400 hover:underline">
              Ver tudo
            </Link>
          </div>
          <p className="mt-1 text-sm text-slate-300">
            Objetivos {vault.done}/{vault.total}
            {vault.metaComplete > 0 && (
              <>
                {" "}
                · Meta {vault.metaCurrent}/{vault.metaComplete}
                {vault.astral ? ` · +${vault.astral} AA` : ""}
              </>
            )}
          </p>
          {vault.openTitles.length > 0 && (
            <ul className="mt-3 space-y-3">
              {vault.openTitles.map((t) => {
                const g = resolveVaultObjective(t);
                return (
                  <li
                    key={t}
                    className="rounded border border-emerald-900/40 bg-emerald-950/30 p-3"
                  >
                    <p className="text-sm text-amber-50">{t}</p>
                    <ActionHints
                      how={g.how}
                      where={g.where}
                      teleportLabel={g.teleportLabel}
                      chatLink={g.chatLink}
                      wikiUrl={g.wikiUrl}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      <DoneList
        title="World bosses feitos hoje"
        items={wbDone}
        empty="Nenhum world boss registrado desde o reset - veja Eventos para o próximo."
        withWp
      />
      <DoneList
        title="Map chests hoje"
        items={chests}
        empty="Nenhum Hero's Choice Chest marcado hoje."
      />
      <DoneList
        title="Dungeons hoje"
        items={dungeons}
        empty="Nenhuma path de dungeon marcada hoje."
      />
      <DoneList
        title="Raids/strikes esta semana"
        items={raids}
        empty="Nenhum encounter de raid marcado nesta semana."
      />
    </div>
  );
}

function DoneList({
  title,
  items,
  empty,
  withWp = false,
}: {
  title: string;
  items: string[];
  empty: string;
  withWp?: boolean;
}) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
      <h3 className="text-amber-100">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">{empty}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {items.map((name) => {
            const wp = withWp ? findNearestWaypoint([name]) : null;
            return (
              <li
                key={name}
                className="flex flex-wrap items-center gap-2 text-sm text-slate-200"
              >
                <span className="rounded bg-slate-800 px-2 py-1 text-xs">
                  {name}
                </span>
                {wp?.waypoint.chatLink && (
                  <ActionHints
                    teleportLabel={`${wp.waypoint.name} - ${wp.waypoint.mapName}`}
                    chatLink={wp.waypoint.chatLink}
                    wikiUrl={wikiSearch(name)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
