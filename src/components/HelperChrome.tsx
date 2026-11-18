import { CatalogRefreshButton } from "@/components/CatalogRefreshButton";
import { CharacterPicker } from "@/components/CharacterPicker";
import { SyncButton } from "@/components/SyncButton";
import { loadCatalogMeta } from "@/lib/catalog/store";
import { getStatus, loadLatestSnapshot } from "@/lib/db";
import { accountAccessFromSnapshot } from "@/lib/gw2/access";
import { listCharacters, getFocusedCharacter } from "@/lib/gw2/focus";
import { resolveAccountStage } from "@/lib/gw2/stage";
import { formatDate } from "@/lib/format";

export function HelperChrome({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const snapshot = loadLatestSnapshot();
  const status = getStatus();
  const focused = snapshot ? getFocusedCharacter(snapshot) : null;
  const chars = snapshot ? listCharacters(snapshot) : [];
  const access = snapshot ? accountAccessFromSnapshot(snapshot) : null;
  const stage = snapshot ? resolveAccountStage(snapshot) : null;
  const needsSync = !snapshot;
  const catalog = loadCatalogMeta();
  const catalogThin =
    !catalog ||
    !(catalog.waypointCount > 0) ||
    !(catalog.eventCount && catalog.eventCount > 0) ||
    !(catalog.masteryCount && catalog.masteryCount > 0) ||
    !(catalog.storyBeatCount && catalog.storyBeatCount > 0);

  return (
    <section className="panel-glow mb-6 space-y-3 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="section-title text-2xl sm:text-[1.7rem]">{title}</h2>
          {subtitle && (
            <p className="mt-1 max-w-3xl break-safe text-sm text-slate-300">
              {subtitle}
            </p>
          )}
          {needsSync && (
            <p className="mt-2 text-sm text-amber-200/90">
              Ainda não carregamos sua conta. Clique em{" "}
              <strong>Atualizar minha conta</strong> (precisa da sua chave do
              jogo no arquivo de configuração local).
            </p>
          )}
          {catalogThin && (
            <p className="mt-2 text-sm text-amber-200/90">
              Catálogo do jogo incompleto. Clique em{" "}
              <strong>Atualizar dados do jogo</strong> para mapas, eventos,
              masteries, ranks WvW e história.
            </p>
          )}
          {access && stage && (
            <p className="mt-2 text-sm text-cyan-200/90">
              {stage.label}: {access.summary}
            </p>
          )}
          {status.latestSnapshot?.syncedAt && (
            <p className="mt-1 text-xs text-slate-500">
              Progresso atualizado em{" "}
              {formatDate(status.latestSnapshot.syncedAt)}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <SyncButton />
          <CatalogRefreshButton />
        </div>
      </div>
      {chars.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cyan-500/15 pt-3">
          <CharacterPicker
            characters={chars}
            selected={focused?.core.name ?? null}
          />
          {focused && (
            <p className="text-sm text-cyan-100/90">
              Personagem em foco: <strong>{focused.core.name}</strong> ·{" "}
              {focused.core.profession} nível {focused.core.level}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
