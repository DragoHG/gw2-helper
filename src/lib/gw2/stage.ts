import { accountAccessFromSnapshot, type AccountAccess } from "@/lib/gw2/access";
import { getFocusedCharacter } from "@/lib/gw2/focus";
import { analyzeCharacterSlots } from "@/lib/gw2/gear";
import type { AccountSnapshot } from "@/lib/gw2/types";

/** Estágio de poder da conta - independente de qual API key o usuário colou. */
export type ProgressStage =
  | "f2p"
  | "leveling"
  | "core80"
  | "ascended"
  | "endgame";

export interface AccountStage {
  stage: ProgressStage;
  label: string;
  summary: string;
  level: number;
  fractalLevel: number;
  ascendedGaps: number;
  access: AccountAccess;
  /** Mostrar Ascended / fractals / elites no guia rápido. */
  showPowerTrack: boolean;
  showAscended: boolean;
  showFractals: boolean;
  showElites: boolean;
  showLegendaries: boolean;
}

export function resolveAccountStage(snapshot: AccountSnapshot): AccountStage {
  const access = accountAccessFromSnapshot(snapshot);
  const focused = getFocusedCharacter(snapshot);
  const level = focused?.core.level ?? 0;
  const fractalLevel = snapshot.account.fractal_level ?? 0;
  const ascendedGaps = focused
    ? analyzeCharacterSlots(snapshot, focused).filter((s) => s.needsUpgrade)
        .length
    : 0;

  let stage: ProgressStage;
  if (access.isFreeToPlayOnly) stage = "f2p";
  else if (level > 0 && level < 80) stage = "leveling";
  else if (ascendedGaps > 4 || fractalLevel < 25) stage = "core80";
  else if (ascendedGaps > 0 || fractalLevel < 75) stage = "ascended";
  else stage = "endgame";

  const labels: Record<ProgressStage, string> = {
    f2p: "Play for Free",
    leveling: "Subindo ao 80",
    core80: "80 - base de poder",
    ascended: "Montando Ascended",
    endgame: "Endgame",
  };

  const summaries: Record<ProgressStage, string> = {
    f2p: "Foque história pessoal, hearts e world bosses core. Expansões e Ascended vêm depois.",
    leveling: "Prioridade: chegar ao 80. Evite gastar gold caro em Ascended agora.",
    core80: "Trilha de poder: trinkets/armas Ascended, Fractals T1 e elite da expansão que você tem.",
    ascended: "Feche gaps Ascended, suba Fractals e masteries/mounts das suas expansões (Skyscale/VoE se tiver).",
    endgame: "Otimize build/stats/AR, T4/CM, Vault, raids/strikes, festivais ativos e collections lendárias.",
  };

  return {
    stage,
    label: labels[stage],
    summary: summaries[stage],
    level,
    fractalLevel,
    ascendedGaps,
    access,
    showPowerTrack: stage !== "f2p" && stage !== "leveling",
    showAscended: stage === "core80" || stage === "ascended" || stage === "endgame",
    showFractals: stage !== "f2p" && (level >= 80 || stage === "core80"),
    showElites: stage !== "f2p" && level >= 80,
    showLegendaries: stage === "endgame" || (stage === "ascended" && ascendedGaps === 0),
  };
}
