import { ActionHints } from "@/components/ActionHints";
import { CopyButton } from "@/components/CopyButton";
import { HelperChrome } from "@/components/HelperChrome";
import { ItemIcon } from "@/components/ItemIcon";
import { RecommendationCard } from "@/components/RecommendationCard";
import { achievementSummary } from "@/lib/achievements/analyze";
import { planAscendedForCharacter } from "@/lib/ascended/planner";
import { getStatus, loadLatestSnapshot, loadRecommendations } from "@/lib/db";
import { eventTimelineSummary } from "@/lib/events/timeline";
import { hasExpansion } from "@/lib/gw2/access";
import { getFocusedCharacter } from "@/lib/gw2/focus";
import { analyzeCharacterSlots } from "@/lib/gw2/gear";
import { resolveAccountStage } from "@/lib/gw2/stage";
import { formatGold } from "@/lib/format";
import { rankMasterySteps } from "@/lib/masteries/analyze";
import { storyRoadmapSteps } from "@/lib/roadmap/story-guide";
import { buildMapSessions } from "@/lib/sessions/map-session";
import { vaultDailySummary } from "@/lib/vault/parse";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const status = getStatus();
  const snapshot = loadLatestSnapshot();
  const pve = loadRecommendations("pve");
  const pvp = loadRecommendations("pvp");

  if (!snapshot) {
    return (
      <div>
        <HelperChrome
          title="O que fazer agora"
          subtitle="Atualize sua conta para receber um plano claro: o que farmar, por quê, e para onde ir no mapa."
        />
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
          <li>Clique em <strong>Atualizar minha conta</strong></li>
          <li>Escolha o personagem (o principal já vem selecionado)</li>
          <li>Siga a lista abaixo - cada item tem waypoint quando existir</li>
        </ol>
      </div>
    );
  }

  const focused = getFocusedCharacter(snapshot);
  const stage = resolveAccountStage(snapshot);
  const ach = achievementSummary(snapshot);
  const gold = snapshot.wallet?.find((c) => c.id === 1)?.value ?? 0;
  const laurels = snapshot.wallet?.find((c) => c.id === 3)?.value ?? 0;
  const gaps = focused
    ? analyzeCharacterSlots(snapshot, focused).filter((s) => s.needsUpgrade)
    : [];
  const ascended =
    stage.showAscended && focused
      ? planAscendedForCharacter(snapshot, focused).slice(0, 3)
      : [];
  const easy = ach.easiest[0];
  const events = eventTimelineSummary(snapshot, { horizonHours: 8 });
  const mounts = new Set(
    (snapshot.mounts?.types ?? []).map((m) => m.toLowerCase()),
  );
  const missingJackal =
    hasExpansion(snapshot, "PathOfFire") && !mounts.has("jackal");
  const missingSkyscale =
    hasExpansion(snapshot, "SecretsOfTheObscure") && !mounts.has("skyscale");
  const vault = vaultDailySummary(snapshot);
  const sessions = buildMapSessions(snapshot, {
    limit: 1,
    light: true,
    skipEvents: true,
  });
  const masteryTop = rankMasterySteps(snapshot, { limit: 1 })[0];
  const storySteps = storyRoadmapSteps(snapshot);
  const storyTop = storySteps[0];

  const guideItems: Array<{ text: string; chatLink?: string }> = [];
  if (storyTop) {
    guideItems.push({
      text: `História agora: ${storyTop.title} - ${storyTop.why}`,
      chatLink: storyTop.chatLink,
    });
  }
  if (stage.stage === "f2p" || stage.stage === "leveling") {
    guideItems.push({
      text: `Prioridade: chegar ao nível 80 (${focused?.core.name ?? "seu personagem"} - lvl ${stage.level || "?"}). ${stage.summary}`,
    });
    guideItems.push({
      text: "Faça world bosses fáceis e o Wizard's Vault do dia - XP e Astral Acclaim sem precisar de expansão.",
    });
  } else {
    if (vault && vault.openTitles.length) {
      guideItems.push({
        text: `Wizard's Vault hoje: ${vault.openTitles.slice(0, 2).join(" - ")} (${vault.done}/${vault.total}).`,
      });
    }
    if (laurels >= 30 && gaps.some((g) => /Amulet|Accessory|Ring|Back/i.test(g.slot))) {
      guideItems.push({
        text: `Você tem ${laurels} Laurels - troque no Laurel Merchant (Lion's Arch) por amuleto/acessórios Ascended.`,
      });
    }
    if (stage.showAscended && gaps.length) {
      guideItems.push({
        text: `Suba Ascended de ${focused?.core.name ?? "seu personagem"} - ${gaps.length} slot(s) ainda fracos.`,
      });
    }
    if (missingJackal) {
      guideItems.push({
        text: "Desbloqueie o Jackal (montaria de Path of Fire) - muda totalmente o farm no deserto.",
      });
    }
    if (missingSkyscale) {
      guideItems.push({
        text: "Desbloqueie o Skyscale (SotO) - a montaria voadora mais útil do jogo.",
      });
    }
    if (stage.showFractals) {
      guideItems.push({
        text: `Fractals (nível ${stage.fractalLevel}) - portal em Lion's Arch. Rings e back Ascended saem daí.`,
      });
    }
  }
  if (easy) {
    guideItems.push({
      text: `Achievement em foco: ${easy.name}`,
      chatLink: easy.chatLink,
    });
  }
  if (guideItems.length === 0) {
    guideItems.push({ text: stage.summary });
  }

  return (
    <div className="space-y-8">
      <HelperChrome
        title="O que fazer agora"
        subtitle={`${stage.label}: ${stage.summary} No PvP o poder vem do painel PvP - Ascended de open world não conta lá.`}
      />

      {!status.hasApiKey && (
        <p className="rounded border border-amber-900/50 bg-amber-950/30 p-3 text-sm text-amber-100">
          Falta configurar a chave da sua conta do jogo no arquivo local. Sem
          ela não dá para ler seu progresso.
        </p>
      )}

      <section className="stat-grid">
        <Mini
          label="Personagem"
          value={focused?.core.name ?? "-"}
          sub={
            focused
              ? `${focused.core.profession} - lvl ${focused.core.level}`
              : undefined
          }
        />
        <Mini label="Gold" value={formatGold(gold)} />
        <Mini label="Seu momento" value={stage.label} sub={stage.access.summary} />
        <Mini
          label={stage.showAscended ? "Slots fracos" : "Fractal"}
          value={
            stage.showAscended ? String(gaps.length) : String(stage.fractalLevel)
          }
          sub={
            stage.showAscended
              ? `Fractal ${stage.fractalLevel}${vault ? ` - Vault ${vault.done}/${vault.total}` : ""}`
              : vault
                ? `Vault ${vault.done}/${vault.total}`
                : undefined
          }
        />
      </section>

      {storyTop && (
        <section className="panel-glow space-y-2 p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h3 className="section-title text-lg">História em foco</h3>
            <Link className="text-sm neon-link hover:underline" href="/story">
              Ver linha completa
            </Link>
          </div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400/80">
            Expansões + Living World - o que falta agora na conta
          </p>
          <p className="text-lg text-cyan-50 break-safe">{storyTop.title}</p>
          <p className="text-sm text-slate-300 break-safe">{storyTop.why}</p>
          {storyTop.bundleWith && storyTop.bundleWith.length > 0 && (
            <ul className="list-disc space-y-0.5 pl-5 text-xs text-slate-400">
              {storyTop.bundleWith.slice(0, 4).map((b, i) => (
                <li key={`home-story-b-${i}`}>{b}</li>
              ))}
            </ul>
          )}
          <ActionHints
            how={storyTop.how}
            where={storyTop.where}
            teleportLabel={storyTop.teleportLabel}
            chatLink={storyTop.chatLink}
            wikiUrl={storyTop.wikiUrl}
          />
          {storySteps.length > 1 && (
            <p className="text-xs text-slate-500">
              Depois na fila:{" "}
              {storySteps
                .slice(1, 3)
                .map((s) => s.title)
                .join(" - ")}
            </p>
          )}
          <p className="flex flex-wrap gap-3 text-sm">
            <Link href="/story" className="neon-link hover:underline">
              História
            </Link>
            <Link href="/achievements" className="neon-link hover:underline">
              Achievements
            </Link>
            <Link href="/events" className="neon-link hover:underline">
              Eventos
            </Link>
            <Link href="/masteries" className="neon-link hover:underline">
              Masteries
            </Link>
            <Link href="/roadmap" className="neon-link hover:underline">
              Linha do tempo
            </Link>
          </p>
        </section>
      )}

      <section className="panel-glow space-y-3 p-4 sm:p-5">
        <h3 className="section-title text-lg">Guia rápido</h3>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-slate-300">
          {guideItems.map((item) => (
            <li key={item.text}>
              {item.text}
              {item.chatLink && (
                <span className="ml-2 inline-flex">
                  <CopyButton text={item.chatLink} label="Copiar waypoint" />
                </span>
              )}
            </li>
          ))}
        </ol>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link className="neon-link hover:underline" href="/roadmap">
            Linha do tempo
          </Link>
          <Link className="neon-link hover:underline" href="/story">
            História
          </Link>
          {stage.showAscended && (
            <Link className="neon-link hover:underline" href="/ascended">
              Ascended
            </Link>
          )}
          <Link className="neon-link hover:underline" href="/achievements">
            Achievements
          </Link>
          <Link className="neon-link hover:underline" href="/events">
            Eventos
          </Link>
          <Link className="neon-link hover:underline" href="/daily">
            Daily
          </Link>
          <Link className="neon-link hover:underline" href="/vault">
            Vault
          </Link>
          <Link className="neon-link hover:underline" href="/materials">
            Materiais
          </Link>
          <Link className="neon-link hover:underline" href="/masteries">
            Masteries
          </Link>
          <Link className="neon-link hover:underline" href="/craft">
            Crafting
          </Link>
          <Link className="neon-link hover:underline" href="/pvp">
            PvP / WvW
          </Link>
          <Link className="neon-link hover:underline" href="/info">
            Sobre
          </Link>
        </div>
      </section>

      {sessions[0] && (
        <section className="panel space-y-2 p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h3 className="section-title text-lg">Sessão multiobjetivo</h3>
            <Link className="text-sm text-amber-400 hover:underline" href="/events">
              Ver eventos
            </Link>
          </div>
          <p className="mt-1 text-lg text-amber-50">
            {sessions[0].mapName} - {sessions[0].objectives.length} coisas de
            uma vez
          </p>
          <p className="text-sm text-slate-300">{sessions[0].why}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
            {sessions[0].objectives.slice(0, 5).map((o) => (
              <li key={o.id}>{o.label}</li>
            ))}
          </ul>
          <ActionHints
            how={sessions[0].how}
            teleportLabel={sessions[0].teleportLabel}
            chatLink={sessions[0].chatLink}
            wikiUrl={sessions[0].wikiUrl}
          />
        </section>
      )}

      {masteryTop && (
        <section className="panel space-y-2 p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h3 className="section-title text-lg">Mastery mais fácil agora</h3>
            <Link
              className="text-sm text-amber-400 hover:underline"
              href="/masteries"
            >
              Ver todas
            </Link>
          </div>
          <p className="mt-1 text-lg text-amber-50">
            {masteryTop.trackName} → {masteryTop.nextLevelName}
          </p>
          <ActionHints
            how={`${masteryTop.how} XP: ${masteryTop.xpGuide.how}`}
            where={masteryTop.where}
            teleportLabel={masteryTop.teleportLabel}
            chatLink={masteryTop.chatLink}
            wikiUrl={masteryTop.wikiUrl}
          />
        </section>
      )}

      {events.primary && (
        <section className="panel space-y-2 p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h3 className="section-title text-lg">Próximo evento útil</h3>
            <Link className="text-sm text-amber-400 hover:underline" href="/events">
              Ver timeline
            </Link>
          </div>
          <p className="mt-1 text-lg text-amber-50">{events.primary.name}</p>
          <ActionHints
            how={
              events.primary.isActive
                ? "Já está rolando - teleporte e entre no LFG (W) se precisar de grupo."
                : `Começa em ~${events.primary.minutesUntilStart} min. Vá com antecedência.`
            }
            where={events.primary.reasons[0]}
            chatLink={events.primary.chatLink}
            teleportLabel={
              events.primary.chatLink ? "Waypoint do evento" : undefined
            }
          />
        </section>
      )}

      {ach.easiest.length > 0 && (
        <section className="panel space-y-3 p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h3 className="section-title text-lg">Achievements mais fáceis agora</h3>
            <Link
              className="text-sm text-amber-400 hover:underline"
              href="/achievements"
            >
              Ver detalhes
            </Link>
          </div>
          <ul className="space-y-3">
            {ach.easiest.slice(0, 5).map((item, i) => (
              <li
                key={item.id}
                className="flex flex-wrap items-start gap-3 border-t border-amber-900/40 pt-3 first:border-0 first:pt-0"
              >
                <ItemIcon src={item.icon} alt="" size={32} />
                <div className="min-w-0 flex-1">
                  <p className="text-amber-50">
                    <span className="mr-2 text-xs text-slate-500">#{i + 1}</span>
                    {item.name}
                  </p>
                  <ActionHints
                    how={item.whyEasy}
                    where={
                      item.nextBits[0]
                        ? `Próximo passo: ${item.nextBits[0]}`
                        : item.requirement || undefined
                    }
                    teleportLabel={item.teleportLabel}
                    chatLink={item.chatLink}
                    wikiUrl={item.wikiUrl}
                  />
                </div>
                <span className="text-sm text-amber-200">
                  {item.current}/{item.max}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ascended.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-lg text-amber-100">Ascended mais fácil (foco)</h3>
          {ascended.map((item) => (
            <article
              key={item.slot}
              className="rounded-lg border border-slate-700 bg-slate-900/50 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-amber-50">{item.title}</h4>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                  {item.bestRoute}
                </span>
              </div>
              <ActionHints
                how={item.how}
                teleportLabel={item.teleportHint}
                chatLink={item.chatLink}
                wikiUrl={item.wikiUrl}
              />
            </article>
          ))}
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-3">
          <h3 className="text-lg text-emerald-300">PvE - próximos passos</h3>
          {pve.recommendations.length === 0 ? (
            <p className="text-sm text-slate-500">
              Sem dicas ainda - atualize a conta.
            </p>
          ) : (
            pve.recommendations.slice(0, 10).map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} />
            ))
          )}
        </section>
        <section className="space-y-3">
          <h3 className="text-lg text-sky-300">PvP / WvW</h3>
          <p className="text-xs text-slate-500">
            sPvP equaliza poder no painel PvP; WvW usa gear de mapa.{" "}
            <Link className="text-amber-400 hover:underline" href="/pvp">
              Página completa
            </Link>
            .
          </p>
          {pvp.recommendations.length === 0 ? (
            <p className="text-sm text-slate-500">
              Sem dados ainda - jogue sPvP ou WvW e atualize a conta.
            </p>
          ) : (
            pvp.recommendations.slice(0, 8).map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} />
            ))
          )}
        </section>
      </div>
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
    <div className="panel p-4">
      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-lg text-cyan-50">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
