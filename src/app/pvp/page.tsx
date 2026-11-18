import { ActionHints } from "@/components/ActionHints";
import { HelperChrome } from "@/components/HelperChrome";
import { RecommendationCard } from "@/components/RecommendationCard";
import { loadLatestSnapshot, loadRecommendations } from "@/lib/db";
import { findNearestWaypoint } from "@/lib/geo/waypoints";
import type { Recommendation } from "@/lib/recommend/types";
import { wikiSearch } from "@/lib/wiki";
import { buildWvwSummary } from "@/lib/wvw/summary";
import Link from "next/link";

export const dynamic = "force-dynamic";

const TEAM_LABEL = {
  red: "Vermelho",
  blue: "Azul",
  green: "Verde",
} as const;

export default async function PvpPage() {
  const snapshot = loadLatestSnapshot();
  const { recommendations } = loadRecommendations("pvp");

  if (!snapshot) {
    return (
      <HelperChrome
        title="PvP / WvW"
        subtitle="Sincronize a conta para ver sPvP (Heart of the Mists), rank WvW, matchup do world e o que fazer agora."
      />
    );
  }

  const stats = snapshot.pvp.stats;
  const wins = stats?.aggregate.wins ?? 0;
  const losses = stats?.aggregate.losses ?? 0;
  const games = wins + losses;
  const winrate = games ? ((wins / games) * 100).toFixed(1) : "-";
  const wvw = await buildWvwSummary(snapshot);
  const portalWp = findNearestWaypoint(["Lion's Arch"]);
  const portalLabel = portalWp
    ? `${portalWp.waypoint.name} - ${portalWp.waypoint.mapName}`
    : "Lion's Arch - portais";
  const portalChat = portalWp?.waypoint.chatLink;

  const spvpRecs = recommendations.filter((r) => r.category !== "wvw");
  const wvwRecs = recommendations.filter((r) => r.category === "wvw");

  return (
    <div className="space-y-8">
      <HelperChrome
        title="PvP / WvW"
        subtitle="Dois modos competitivos: Structured PvP (poder equalizado no painel PvP) e World vs World (seu gear de mapa + siege). Ascended não conta no Heart of the Mists."
      />

      <p className="flex flex-wrap gap-3 text-sm">
        <a
          href={wikiSearch("Structured PvP")}
          target="_blank"
          rel="noreferrer"
          className="neon-link hover:underline"
        >
          Wiki sPvP
        </a>
        <a
          href={wikiSearch("World versus World")}
          target="_blank"
          rel="noreferrer"
          className="neon-link hover:underline"
        >
          Wiki WvW
        </a>
        <Link href="/vault" className="neon-link hover:underline">
          Vault (objetivos PvP/WvW) →
        </Link>
        <Link href="/roadmap" className="neon-link hover:underline">
          Linha do tempo →
        </Link>
      </p>

      <section className="space-y-3">
        <h3 className="font-display text-xl text-cyan-100">World vs World</h3>
        <p className="text-sm text-slate-400">
          Rank e world vêm da sua conta. O matchup (cores/VP) é ao vivo da API
          pública - atualize a página para refrescar o placar.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Rank WvW"
            value={String(wvw.rank || "-")}
            sub={wvw.rankTitle ?? undefined}
          />
          <Stat
            label="World"
            value={wvw.worldName ?? String(wvw.worldId || "-")}
            sub={
              wvw.match?.team
                ? `Time ${TEAM_LABEL[wvw.match.team]}`
                : undefined
            }
          />
          <Stat label="Badges of Honor" value={String(wvw.badgeOfHonor)} />
          <Stat
            label="Skirmish tickets"
            value={String(wvw.skirmishTickets)}
            sub={
              wvw.warSupplies
                ? `${wvw.warSupplies} War Supplies`
                : undefined
            }
          />
        </div>

        {wvw.nextTitle && (
          <p className="text-sm text-slate-300">
            Próximo título: <span className="text-cyan-100">{wvw.nextTitle}</span>{" "}
            (rank {wvw.nextTitleAt})
          </p>
        )}

        {wvw.match ? (
          <article className="panel space-y-3 p-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h4 className="text-lg text-cyan-50">
                Matchup {wvw.match.matchId}
              </h4>
              <span className="text-xs text-slate-500">ao vivo</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 text-sm">
              {(["red", "blue", "green"] as const).map((color) => (
                <div
                  key={color}
                  className={`rounded border px-3 py-2 ${
                    wvw.match?.team === color
                      ? "border-cyan-400/40 bg-cyan-950/30"
                      : "border-slate-700/80 bg-slate-900/40"
                  }`}
                >
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {TEAM_LABEL[color]}
                    {wvw.match?.team === color ? " · você" : ""}
                  </p>
                  <p className="text-cyan-50">
                    {wvw.match?.primaryWorldNames[color]}
                  </p>
                  <p className="text-xs text-slate-400">
                    VP {wvw.match?.victoryPoints?.[color] ?? "-"}
                    {wvw.match?.skirmishScores
                      ? ` · skirmish ${wvw.match.skirmishScores[color]}`
                      : ""}
                  </p>
                </div>
              ))}
            </div>
            {wvw.match.linkedWorldNames.length > 1 && (
              <p className="text-xs text-slate-400">
                Worlds linkados no seu time:{" "}
                {wvw.match.linkedWorldNames.join(" · ")}
              </p>
            )}
            <ActionHints
              how="Entre pelo portal WvW. Siga um commander (LFG) no borderlands do seu time ou no Eternal Battlegrounds."
              where="Portal WvW em Lion's Arch / qualquer cidade"
              teleportLabel={portalLabel}
              chatLink={portalChat}
              wikiUrl={wikiSearch("World versus World")}
            />
          </article>
        ) : (
          <p className="text-sm text-slate-500">
            Matchup indisponível agora - o world pode estar em reset ou a API
            pública falhou. Tente de novo em instantes.
          </p>
        )}

        <RecList
          title="Próximos passos WvW"
          empty="Sem dicas WvW extras - jogue um skirmish e atualize a conta."
          recs={wvwRecs}
        />
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-xl text-cyan-100">
          Structured PvP
        </h3>
        <p className="text-sm text-slate-400">
          Heart of the Mists - poder vem do amuleto/runas do painel PvP, não do
          Ascended de open world.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Rank sPvP" value={String(stats?.pvp_rank ?? "-")} />
          <Stat label="Partidas" value={String(games || "-")} />
          <Stat label="Winrate" value={games ? `${winrate}%` : "-"} />
          <Stat
            label="Standings / League tickets"
            value={String(snapshot.pvp.standings.length || "0")}
            sub={
              snapshot.pvpLeagueTickets
                ? `${snapshot.pvpLeagueTickets} tickets`
                : undefined
            }
          />
        </div>

        {stats?.professions && (
          <div className="panel p-4">
            <h4 className="text-cyan-200">Profissões (sPvP)</h4>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="px-2 py-1">Profissão</th>
                    <th className="px-2 py-1">Wins</th>
                    <th className="px-2 py-1">Losses</th>
                    <th className="px-2 py-1">Jogos</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.professions)
                    .sort(
                      (a, b) =>
                        b[1].wins + b[1].losses - (a[1].wins + a[1].losses),
                    )
                    .map(([name, s]) => (
                      <tr key={name} className="border-t border-slate-800">
                        <td className="px-2 py-1 capitalize">{name}</td>
                        <td className="px-2 py-1">{s.wins}</td>
                        <td className="px-2 py-1">{s.losses}</td>
                        <td className="px-2 py-1">{s.wins + s.losses}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <RecList
          title="Próximos passos sPvP"
          empty="Sem dicas sPvP ainda. Jogue Unranked no Heart of the Mists e atualize a conta."
          recs={spvpRecs}
        />
      </section>
    </div>
  );
}

function RecList({
  title,
  empty,
  recs,
}: {
  title: string;
  empty: string;
  recs: Recommendation[];
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-lg text-sky-200">{title}</h4>
      {recs.length === 0 ? (
        <p className="text-sm text-slate-500">{empty}</p>
      ) : (
        recs.map((rec) => <RecommendationCard key={rec.id} rec={rec} />)
      )}
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
    <div className="panel p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-xl text-cyan-50">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

