import { rankAchievements } from "@/lib/achievements/analyze";
import { findNearestWaypoint } from "@/lib/geo/waypoints";
import type { AccountSnapshot } from "@/lib/gw2/types";
import { countOwned } from "@/lib/inventory/owned";
import { wikiSearch } from "@/lib/wiki";

export interface LegendaryPlanItem {
  id: string;
  title: string;
  why: string;
  how: string;
  wikiUrl: string;
  chatLink?: string;
  teleportLabel?: string;
  progress?: string;
  priority: number;
}

/** Próximos passos lendários - resiliente a snapshot parcial. */
export function planLegendaries(
  snapshot: AccountSnapshot,
  limit = 5,
): LegendaryPlanItem[] {
  const out: LegendaryPlanItem[] = [];
  try {
    const armory = snapshot.legendaryArmory ?? [];
    const collections = rankAchievements(snapshot, {
      mode: "pve",
      limit: 12,
      minPct: 0.15,
      includeZero: false,
    }).filter((a) =>
      /legendary|gift of |precursor|collection|gen \d|generation/i.test(
        `${a.name} ${a.categoryName ?? ""} ${a.requirement}`,
      ),
    );

    for (const c of collections.slice(0, limit)) {
      const wp = findNearestWaypoint([
        c.nextBits[0],
        c.name,
        c.categoryName,
      ]);
      out.push({
        id: `leg-ach-${c.id}`,
        title: c.name,
        why: c.whyEasy,
        how: `Progresso ${c.current}/${c.max}.${c.nextBits[0] ? ` Próximo: ${c.nextBits[0]}.` : ""} Continue na página Achievements.`,
        wikiUrl: c.wikiUrl,
        chatLink: c.chatLink ?? wp?.waypoint.chatLink,
        teleportLabel: c.teleportLabel,
        progress: `${c.current}/${c.max}`,
        priority: c.easeScore,
      });
    }

    if (armory.length === 0 && out.length === 0) {
      out.push({
        id: "leg-intro",
        title: "Começar uma collection lendária",
        why: "Sem lendários no armory - o próximo teto de QoL após Ascended.",
        how: "Escolha uma arma lendária da sua profissão (Gen 1/2/3). Farm Gift of Fortune / Mastery e precursors.",
        wikiUrl: wikiSearch("Legendary weapon"),
        priority: 10,
      });
    } else if (armory.length > 0 && out.length < limit) {
      out.push({
        id: "leg-armory-ok",
        title: `Legendary Armory: ${armory.length} item(ns)`,
        why: "Você já tem lendários na conta - próximo ganho é completar outra collection quase pronta ou Gen 3 QoL.",
        how: "Olhe achievements ItemSet com alto progresso e priorize o que falta em mats (ectos, gifts).",
        wikiUrl: wikiSearch("Legendary Armory"),
        priority: 5,
      });
    }

    // Sinalizar ectos se collection em andamento
    const ectoId = 19721;
    const ectos = countOwned(snapshot, ectoId);
    if (collections.length > 0 && ectos < 100) {
      out.push({
        id: "leg-ectos",
        title: `Ectos para Gift of Fortune (~${ectos} na conta)`,
        why: "Collections lendárias consomem muitos Glob of Ectoplasm.",
        how: "Salvage rares/exotics, metas e fractals. Veja Materials.",
        wikiUrl: wikiSearch("Glob of Ectoplasm"),
        priority: 20,
      });
    }
  } catch {
    /* snapshot parcial */
  }

  return out.sort((a, b) => b.priority - a.priority).slice(0, limit);
}
