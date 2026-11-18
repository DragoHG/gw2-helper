import { findNearestWaypoint } from "@/lib/geo/waypoints";
import type { Recommendation } from "@/lib/recommend/types";
import {
  priorityFromScore,
  scoreRecommendation,
} from "@/lib/recommend/types";
import { withTeleport } from "@/lib/recommend/teleport";
import type { AccountSnapshot } from "@/lib/gw2/types";
import { parseVaultTracks } from "@/lib/vault/parse";
import { wikiSearch } from "@/lib/wiki";

function withPriority(rec: Recommendation): Recommendation {
  return { ...rec, priority: priorityFromScore(rec.score) };
}

/** Objetivos abertos do Wizard's Vault → recomendações (qualquer conta com scope). */
export function analyzeVault(snapshot: AccountSnapshot): Recommendation[] {
  try {
    const tracks = parseVaultTracks(snapshot);
    if (!tracks.length) return [];

    const recs: Recommendation[] = [];
    const daily = tracks.find((t) => t.key === "daily");
    const weekly = tracks.find((t) => t.key === "weekly");

    if (daily) {
      const open = daily.objectives.filter((o) => !o.claimed);
      if (open.length) {
        const top = open.slice(0, 3);
        const first = top[0];
        const wp = findNearestWaypoint([first.title, first.track]);
        recs.push(
          withTeleport(
            withPriority({
              id: "pve-vault-daily",
              mode: "pve",
              category: "vault",
              title: `Wizard's Vault daily (${open.length} abertos)`,
              why: `Astral Acclaim fácil: meta ${daily.metaProgressCurrent}/${daily.metaProgressComplete || "?"}${daily.metaRewardAstral ? ` · +${daily.metaRewardAstral} AA` : ""}. Ideal em qualquer estágio.`,
              how: `Faça agora: ${top.map((o) => o.title).join(" · ")}. Painel W no jogo ou página Vault.`,
              impact: 8,
              effort: 2,
              score: scoreRecommendation(8, 2, 1.2),
              links: [
                { label: "Vault", href: "/vault" },
                { label: "Wiki", href: wikiSearch("Wizard's Vault") },
              ],
              meta: {
                openTitles: top.map((o) => o.title),
                chatLink: wp?.waypoint.chatLink,
              },
            }),
            [first.title, "Lion's Arch"],
          ),
        );
      }
    }

    if (weekly) {
      const open = weekly.objectives.filter((o) => !o.claimed);
      if (open.length) {
        const first = open[0];
        recs.push(
          withTeleport(
            withPriority({
              id: "pve-vault-weekly",
              mode: "pve",
              category: "vault",
              title: `Wizard's Vault weekly (${open.length} abertos)`,
              why: "Weeklies dão mais AA por esforço - bom complemento ao daily.",
              how: `Próximo: ${first.title}. Veja a lista completa em Vault.`,
              impact: 6,
              effort: 3,
              score: scoreRecommendation(6, 3, 1.05),
              links: [
                { label: "Vault", href: "/vault" },
                { label: "Wiki", href: wikiSearch("Wizard's Vault") },
              ],
              meta: { openTitles: open.slice(0, 4).map((o) => o.title) },
            }),
            [first.title],
          ),
        );
      }
    }

    return recs;
  } catch {
    return [];
  }
}
