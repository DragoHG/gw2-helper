import { rankAchievements } from "@/lib/achievements/analyze";
import { findNearestWaypoint } from "@/lib/geo/waypoints";
import { getFocusedCharacter } from "@/lib/gw2/focus";
import type { AccountSnapshot } from "@/lib/gw2/types";
import {
  Recommendation,
  priorityFromScore,
  scoreRecommendation,
} from "@/lib/recommend/types";
import { wikiSearch } from "@/lib/wiki";
import { buildWvwSummarySync } from "@/lib/wvw/summary";

function withPriority(rec: Recommendation): Recommendation {
  return { ...rec, priority: priorityFromScore(rec.score) };
}

function portalMeta() {
  const wp = findNearestWaypoint(["Lion's Arch"]);
  return {
    chatLink: wp?.waypoint.chatLink,
    teleportLabel: wp
      ? `${wp.waypoint.name} - ${wp.waypoint.mapName}`
      : "Lion's Arch - portais PvP / WvW",
  };
}

/** Recomendações de combate competitivo: sPvP (Heart of the Mists) + WvW. */
export function buildPvpRecommendations(snapshot: AccountSnapshot): Recommendation[] {
  const recs: Recommendation[] = [];
  const stats = snapshot.pvp?.stats ?? null;
  const primary = getFocusedCharacter(snapshot);
  const permissions = new Set(snapshot.tokenInfo?.permissions ?? []);
  const portal = portalMeta();
  const wvw = buildWvwSummarySync(snapshot);

  if (!permissions.has("pvp")) {
    recs.push(
      withPriority({
        id: "pvp-key-scope",
        mode: "pvp",
        category: "progression",
        title: "API key sem scope PvP",
        why: "Sem a permissão `pvp` não dá para ler rank, standings e histórico de sPvP.",
        how: "Crie uma nova key em account.arena.net/applications incluindo o scope PvP (WvW rank vem em /account sem scope extra) e atualize o .env.local.",
        impact: 9,
        effort: 1,
        score: scoreRecommendation(9, 1),
        links: [
          {
            label: "Criar API key",
            href: "https://account.arena.net/applications",
          },
        ],
      }),
    );
    // Ainda assim dá para orientar WvW (rank/world/wallet)
  }

  // ---------- WvW (qualquer conta com world) ----------
  if (wvw.worldId > 0) {
    if (wvw.rank < 1) {
      recs.push({
        id: "wvw-start",
        mode: "pvp",
        category: "wvw",
        title: "Começar no World vs World",
        why: "WvW é o combate em mundo aberto entre worlds - recompensas, Badges of Honor e progressão de rank própria.",
        how: "Em qualquer cidade, use o portal WvW (ou LFG). Entre com um commander tag se for iniciante e siga o zerg no início.",
        impact: 8,
        effort: 2,
        score: scoreRecommendation(8, 2),
        meta: portal,
        links: [
          { label: "Wiki WvW", href: wikiSearch("World versus World") },
          { label: "PvP / WvW", href: "/pvp" },
        ],
      });
    } else if (wvw.rank < 30) {
      recs.push({
        id: "wvw-rank-early",
        mode: "pvp",
        category: "wvw",
        title: `Subir rank WvW (atual ${wvw.rank}${wvw.rankTitle ? ` · ${wvw.rankTitle}` : ""})`,
        why: "Ranks iniciais liberam World Ability Points e títulos. Gear Ascended ajuda em WvW (diferente do sPvP).",
        how: wvw.nextTitle
          ? `Foque skirmishes e objetivos (camps/towers). Próximo título: ${wvw.nextTitle} no rank ${wvw.nextTitleAt}.`
          : "Participe de skirmishes, capture camps e siga o squad. Gaste World Ability Points no painel WvW (B).",
        impact: 7,
        effort: 3,
        score: scoreRecommendation(7, 3),
        meta: { ...portal, rank: wvw.rank },
        links: [
          { label: "Wiki WvW ranks", href: wikiSearch("WvW Rank") },
          { label: "Abrir PvP / WvW", href: "/pvp" },
        ],
      });
    } else {
      recs.push({
        id: "wvw-rank-mid",
        mode: "pvp",
        category: "wvw",
        title: `WvW ativo · rank ${wvw.rank}${wvw.rankTitle ? ` (${wvw.rankTitle})` : ""}`,
        why: `${wvw.worldName ?? "Seu world"} está na temporada atual. Consistência em skirmish > farm solo sem objetivo.`,
        how: wvw.nextTitle
          ? `Empurre borders com squad; próximo título ${wvw.nextTitle} (${wvw.nextTitleAt}).`
          : "Priorize skirmish timers e defense/offense de towers com o commander.",
        impact: 5,
        effort: 4,
        score: scoreRecommendation(5, 4),
        meta: portal,
        links: [{ label: "Matchup atual", href: "/pvp" }],
      });
    }

    if (wvw.badgeOfHonor >= 250) {
      recs.push({
        id: "wvw-badges",
        mode: "pvp",
        category: "wvw",
        title: `Gastar Badges of Honor (${wvw.badgeOfHonor})`,
        why: "Badges acumularam - dão Ascended, materiais e progressão lendária via WvW.",
        how: "No hub WvW / Eternal Battlegrounds, fale com os vendors de Badge of Honor (armadura/trinkets Ascended ou mats).",
        impact: 7,
        effort: 2,
        score: scoreRecommendation(7, 2),
        meta: { ...portal, badges: wvw.badgeOfHonor },
        links: [
          { label: "Badge of Honor", href: wikiSearch("Badge of Honor") },
        ],
      });
    }

    if (wvw.skirmishTickets >= 3) {
      recs.push({
        id: "wvw-skirmish-tickets",
        mode: "pvp",
        category: "wvw",
        title: `Resgatar Skirmish Claim Tickets (${wvw.skirmishTickets})`,
        why: "Tickets de skirmish expiram com a season - não deixe parado na carteira.",
        how: "Abra o painel WvW → Reward Tracks / vendors de skirmish e resgate chests ou progresso de track.",
        impact: 6,
        effort: 1,
        score: scoreRecommendation(6, 1),
        meta: portal,
        links: [
          {
            label: "Skirmish Claim Ticket",
            href: wikiSearch("WvW Skirmish Claim Ticket"),
          },
        ],
      });
    }

    if (wvw.warSupplies >= 50) {
      recs.push({
        id: "wvw-war-supplies",
        mode: "pvp",
        category: "wvw",
        title: `Usar War Supplies (${wvw.warSupplies})`,
        why: "War Supplies alimentam siege (rams/arrows/golems) - úteis no zerg e em defesa.",
        how: "No mapa WvW, use a siege weapon kit / depot perto de objetivos. Peça ao commander o que craftar.",
        impact: 4,
        effort: 2,
        score: scoreRecommendation(4, 2),
        links: [{ label: "War Supplies", href: wikiSearch("War Supplies") }],
      });
    }
  }

  const easiestWvw = rankAchievements(snapshot, {
    mode: "wvw",
    limit: 3,
    minPct: 0.1,
  });
  if (easiestWvw[0]) {
    const top = easiestWvw[0];
    recs.push({
      id: "wvw-achievements-easiest",
      mode: "pvp",
      category: "wvw",
      title: `Achievement WvW: ${top.name}`,
      why: top.whyEasy,
      how: `Progresso ${top.current}/${top.max}. ${top.beginnerTip}`,
      impact: top.remaining <= 5 ? 6 : 4,
      effort: Math.min(7, Math.max(1, Math.ceil(top.remaining / 3))),
      score: scoreRecommendation(
        top.remaining <= 5 ? 6 : 4,
        Math.min(7, Math.max(1, Math.ceil(top.remaining / 3))),
      ),
      meta: {
        chatLink: top.chatLink,
        teleportLabel: top.teleportLabel,
      },
      links: [
        { label: top.name, href: top.wikiUrl },
        { label: "Achievements", href: "/achievements" },
      ],
    });
  }

  // ---------- sPvP ----------
  if (!permissions.has("pvp")) {
    return recs.map((rec) => withPriority(rec)).sort((a, b) => b.score - a.score);
  }

  if (!stats) {
    recs.push(
      withPriority({
        id: "pvp-no-stats",
        mode: "pvp",
        category: "progression",
        title: "Começar no Heart of the Mists (sPvP)",
        why: "Ainda sem stats de Structured PvP - modo com poder equalizado (amuleto/runas do painel PvP).",
        how: "Portal PvP na cidade → Unranked. Monte amuleto + runas no painel PvP (H). Ascended de mapa não conta aqui.",
        impact: 7,
        effort: 2,
        score: scoreRecommendation(7, 2),
        meta: portal,
        links: [
          { label: "Structured PvP", href: wikiSearch("Structured PvP") },
        ],
      }),
    );
    return recs.map((rec) => withPriority(rec)).sort((a, b) => b.score - a.score);
  }

  const rank = stats.pvp_rank ?? 0;
  const wins = stats.aggregate?.wins ?? 0;
  const losses = stats.aggregate?.losses ?? 0;
  const games = wins + losses;
  const winrate = games > 0 ? wins / games : 0;
  const leagueTickets = snapshot.pvpLeagueTickets ?? 0;

  if (rank < 20) {
    recs.push({
      id: "pvp-rank-early",
      mode: "pvp",
      category: "pvp_rank",
      title: `Subir PvP rank (atual ${rank})`,
      why: "Ranks iniciais liberam finisher/rewards e habituam às regras do modo (gear equalizado).",
      how: "Jogue Unranked ou Ranked 2v2/5v5. Foque 1 profissão. Use amuletos/runas do painel PvP.",
      impact: 8,
      effort: 3,
      score: scoreRecommendation(8, 3),
      meta: { ...portal, rank, wins, losses },
      links: [{ label: "Structured PvP", href: wikiSearch("Structured PvP") }],
    });
  } else if (rank < 40) {
    recs.push({
      id: "pvp-rank-mid",
      mode: "pvp",
      category: "pvp_rank",
      title: `Continuar rank PvP (${rank})`,
      why: "Você já passou do tutorial prático. Reward tracks e rank chests melhoram com consistência.",
      how: "Escolha 1-2 builds e rode reward track ativa. Evite trocar de classe toda partida.",
      impact: 6,
      effort: 4,
      score: scoreRecommendation(6, 4),
      meta: { rank },
    });
  } else {
    recs.push({
      id: "pvp-rank-high",
      mode: "pvp",
      category: "pvp_rank",
      title: `Rank PvP sólido (${rank})`,
      why: "Base de rank ok. O ganho agora é mecânica/composição, não gear.",
      how: "Estude matchups da sua elite e rode ranked com grupo fixo quando possível.",
      impact: 4,
      effort: 5,
      score: scoreRecommendation(4, 5),
      meta: { rank },
    });
  }

  if (leagueTickets >= 5) {
    recs.push({
      id: "pvp-league-tickets",
      mode: "pvp",
      category: "pvp_rank",
      title: `Gastar PvP League Tickets (${leagueTickets})`,
      why: "Tickets de league compram recompensas da season no vendor do Heart of the Mists.",
      how: "Entre no PvP lobby e fale com o League vendor / reward panel da season atual.",
      impact: 5,
      effort: 1,
      score: scoreRecommendation(5, 1),
      meta: portal,
      links: [
        { label: "PvP League Ticket", href: wikiSearch("PvP League Ticket") },
      ],
    });
  }

  if (games > 15 && winrate < 0.45) {
    recs.push({
      id: "pvp-winrate",
      mode: "pvp",
      category: "build",
      title: `Winrate sPvP baixo (${(winrate * 100).toFixed(0)}%)`,
      why: "Com amostras >15 jogos, winrate fraco costuma ser build/role errados, não azar.",
      how: "Pegue uma build meta fácil (HardStuck PvP / Metabattle), treine 20 jogos só nela, depois ajuste.",
      impact: 8,
      effort: 4,
      score: scoreRecommendation(8, 4),
      meta: { winrate, games },
      links: [
        { label: "HardStuck PvP builds", href: "https://hardstuck.gg/gw2/builds/" },
        { label: "MetaBattle PvP", href: "https://metabattle.com/wiki/PvP" },
      ],
    });
  }

  if (primary) {
    recs.push({
      id: `pvp-build-${primary.core.name}`,
      mode: "pvp",
      category: "build",
      title: `Build sPvP para ${primary.core.name} (${primary.core.profession})`,
      why: "sPvP usa amuletos/runas/sigilos do painel PvP - separado do gear Ascended de PvE/WvW.",
      how: "Abra o painel PvP → Equipment. Monte amuleto + runas da build escolhida. Não gaste gold de PvE aqui.",
      character: primary.core.name,
      impact: 9,
      effort: 2,
      score: scoreRecommendation(9, 2),
      links: [
        {
          label: `Builds ${primary.core.profession}`,
          href: `https://hardstuck.gg/gw2/builds/${primary.core.profession.toLowerCase()}/`,
        },
      ],
    });
  }

  const professions = Object.entries(stats.professions ?? {});
  if (professions.length > 0) {
    const sorted = professions.sort(
      (a, b) => b[1].wins + b[1].losses - (a[1].wins + a[1].losses),
    );
    const [topName, topStats] = sorted[0];
    const topGames = topStats.wins + topStats.losses;
    if (professions.length >= 4 && topGames < games * 0.4) {
      recs.push({
        id: "pvp-focus-profession",
        mode: "pvp",
        category: "build",
        title: "Foque 1-2 profissões no sPvP",
        why: "Você espalhou jogos em muitas classes; o aprendizado fica raso.",
        how: `Priorize ${topName} (já é a mais jogada) por 2-3 semanas antes de expandir.`,
        impact: 7,
        effort: 2,
        score: scoreRecommendation(7, 2),
        meta: { topProfession: topName, topGames, totalGames: games },
      });
    }
  }

  if ((snapshot.pvp?.standings?.length ?? 0) === 0 && games >= 5) {
    recs.push({
      id: "pvp-ranked-season",
      mode: "pvp",
      category: "progression",
      title: "Entrar na season ranked (sPvP)",
      why: "Standings vazios - sem participação ranked da season atual detectada.",
      how: "Jogue algumas partidas Ranked para entrar na ladder e liberar recompensas de season.",
      impact: 6,
      effort: 3,
      score: scoreRecommendation(6, 3),
      meta: portal,
    });
  }

  recs.push({
    id: "pvp-vs-pve-reminder",
    mode: "pvp",
    category: "unlock",
    title: "Lembrete: sPvP ≠ PvE ≠ WvW",
    why: "sPvP equaliza poder (painel PvP). WvW usa seu gear de mapa. Ascended não te fortalece no Heart of the Mists.",
    how: "Separe objetivos: PvE = gear/mastery; sPvP = amuleto/rank; WvW = siege + rank + badges.",
    impact: 3,
    effort: 1,
    score: scoreRecommendation(3, 1, 0.5),
  });

  const easiestPvp = rankAchievements(snapshot, {
    mode: "pvp",
    limit: 5,
    minPct: 0.2,
  });
  if (easiestPvp.length) {
    const top = easiestPvp[0];
    recs.push({
      id: "pvp-achievements-easiest",
      mode: "pvp",
      category: "unlock",
      title: `Achievement sPvP fácil: ${top.name}`,
      why: top.whyEasy,
      how: `Complete ${top.current}/${top.max}. Lista em Achievements.`,
      impact: top.remaining <= 5 ? 6 : 4,
      effort: Math.min(7, Math.max(1, Math.ceil(top.remaining / 2))),
      score: scoreRecommendation(
        top.remaining <= 5 ? 6 : 4,
        Math.min(7, Math.max(1, Math.ceil(top.remaining / 2))),
      ),
      links: [
        { label: top.name, href: top.wikiUrl },
        { label: "Achievements", href: "/achievements" },
      ],
    });
  }

  return recs
    .map((rec) => withPriority(rec))
    .sort((a, b) => b.score - a.score);
}
