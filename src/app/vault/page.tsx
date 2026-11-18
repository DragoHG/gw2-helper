import { ActionHints } from "@/components/ActionHints";
import { HelperChrome } from "@/components/HelperChrome";
import { ItemIcon } from "@/components/ItemIcon";
import { loadLatestSnapshot } from "@/lib/db";
import { resolveVaultObjective } from "@/lib/vault/guide";
import {
  parseVaultListings,
  parseVaultTracks,
  type VaultObjective,
  type VaultTrack,
} from "@/lib/vault/parse";
import { wikiSearch } from "@/lib/wiki";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function VaultPage() {
  const snapshot = loadLatestSnapshot();
  if (!snapshot) {
    return (
      <HelperChrome
        title="Wizard's Vault"
        subtitle="Atualize a conta para ver os objetivos do dia/semana e a loja de Astral Acclaim."
      />
    );
  }

  const tracks = parseVaultTracks(snapshot);
  const listings = parseVaultListings(snapshot).slice(0, 24);

  return (
    <div className="space-y-6">
      <HelperChrome
        title="Wizard's Vault"
        subtitle="Painel da season: complete objetivos daily/weekly, ganhe Astral Acclaim e troque por conveniência na loja. Ótimo em qualquer estágio - conta nova ou endgame."
      />
      <p className="flex flex-wrap gap-3 text-sm">
        <a
          href={wikiSearch("Wizard's Vault")}
          target="_blank"
          rel="noreferrer"
          className="text-amber-400 hover:underline"
        >
          Wiki - como funciona o Vault
        </a>
        <Link href="/daily" className="text-amber-400 hover:underline">
          Rotina diária →
        </Link>
        <Link href="/events" className="text-amber-400 hover:underline">
          Eventos →
        </Link>
      </p>

      {tracks.length === 0 ? (
        <p className="text-sm text-slate-500">
          Ainda sem dados do Vault nesta atualização. Jogue um pouco, abra o
          Vault no jogo (painel H) e atualize a conta de novo.
        </p>
      ) : (
        tracks.map((track) => <TrackSection key={track.key} track={track} />)
      )}

      <section className="space-y-3">
        <h3 className="text-lg text-amber-100">Loja (amostra)</h3>
        <p className="text-xs text-slate-400">
          Preços em Astral Acclaim. Priorize conveniência (bags, boosts,
          conveniences) se estiver começando.
        </p>
        {listings.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum item da loja listado agora.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <article
                key={l.id}
                className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-900/40 p-3"
              >
                <ItemIcon src={l.itemIcon} alt={l.itemName ?? ""} size={36} />
                <div className="min-w-0">
                  <p className="text-sm text-amber-50">
                    {l.itemName ?? `Item #${l.itemId}`}
                    {l.itemCount > 1 ? ` ×${l.itemCount}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {l.type} · {l.cost} AA · {l.purchased}/{l.purchaseLimit}{" "}
                    comprados
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TrackSection({ track }: { track: VaultTrack }) {
  const open = track.objectives.filter((o) => !o.claimed);
  const done = track.objectives.length - open.length;

  return (
    <section className="space-y-3 rounded-xl border border-slate-700 bg-slate-900/40 p-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-lg text-amber-100">{track.label}</h3>
          <p className="text-sm text-slate-400">
            Objetivos {done}/{track.objectives.length}
            {track.metaProgressComplete > 0 && (
              <>
                {" "}
                · Meta {track.metaProgressCurrent}/{track.metaProgressComplete}
                {track.metaRewardAstral
                  ? ` · +${track.metaRewardAstral} AA`
                  : ""}
                {track.metaRewardClaimed ? " · meta reivindicada" : ""}
              </>
            )}
          </p>
        </div>
      </div>
      {track.metaProgressComplete > 0 && (
        <ProgressBar
          current={track.metaProgressCurrent}
          max={track.metaProgressComplete}
        />
      )}
      <ul className="space-y-3">
        {track.objectives.map((obj) => (
          <ObjectiveRow key={obj.id} obj={obj} />
        ))}
      </ul>
    </section>
  );
}

function ObjectiveRow({ obj }: { obj: VaultObjective }) {
  const complete =
    obj.claimed ||
    (obj.progressComplete > 0 && obj.progressCurrent >= obj.progressComplete);
  const guide = resolveVaultObjective(obj.title);
  return (
    <li
      className={`rounded-lg border px-3 py-3 ${
        complete
          ? "border-emerald-900/40 bg-emerald-950/20"
          : "border-slate-700 bg-slate-950/40"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm ${complete ? "text-slate-400 line-through" : "text-amber-50"}`}
          >
            {obj.title}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {obj.track} · {obj.acclaim} AA
            {obj.claimed ? " · reivindicado" : ""}
          </p>
          {!complete && (
            <ActionHints
              how={guide.how}
              where={guide.where}
              teleportLabel={guide.teleportLabel}
              chatLink={guide.chatLink}
              wikiUrl={guide.wikiUrl}
              wikiLabel="Wiki deste objetivo"
            />
          )}
        </div>
        {obj.progressComplete > 0 && (
          <span className="text-sm text-amber-200">
            {obj.progressCurrent}/{obj.progressComplete}
          </span>
        )}
      </div>
      {obj.progressComplete > 0 && (
        <ProgressBar
          current={obj.progressCurrent}
          max={obj.progressComplete}
        />
      )}
    </li>
  );
}

function ProgressBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded bg-slate-800">
      <div className="h-full rounded bg-amber-600" style={{ width: `${pct}%` }} />
    </div>
  );
}
