import type { AccountSnapshot, CharacterSnapshot, ItemDetails } from "@/lib/gw2/types";

/** AR mínima confortável por faixa de fractal (heurística estável). */
export const AR_THRESHOLDS = {
  t1: 0,
  t2: 0,
  t3: 45,
  t4: 100,
  cm: 150,
} as const;

function agonyFromItem(item?: ItemDetails): number {
  if (!item) return 0;
  const details = item.details as
    | { infix_upgrade?: { attributes?: Array<{ attribute: string; modifier: number }> } }
    | undefined;
  const attrs = details?.infix_upgrade?.attributes ?? [];
  let sum = 0;
  for (const a of attrs) {
    if (/agony/i.test(a.attribute)) sum += a.modifier ?? 0;
  }
  // Fallback por nome (infusions clássicas)
  if (sum === 0 && /agony|fractal/i.test(item.name)) {
    const m = item.name.match(/\+(\d+)/);
    if (m) sum = Number(m[1]) || 0;
  }
  return sum;
}

/** Soma AR do personagem focado a partir de infusions no equipment. Nunca lança. */
export function calculateAgonyResistance(
  snapshot: AccountSnapshot,
  character: CharacterSnapshot | null | undefined,
): { total: number; infusionCount: number; known: boolean } {
  try {
    if (!character) return { total: 0, infusionCount: 0, known: false };
    let total = 0;
    let infusionCount = 0;
    let known = false;
    for (const eq of character.equipment ?? []) {
      for (const id of eq.infusions ?? []) {
        infusionCount += 1;
        const item = snapshot.itemsIndex?.[id];
        const ar = agonyFromItem(item);
        if (ar > 0) known = true;
        total += ar;
      }
    }
    // Se tem infusions mas nomes sem AR parseável, known=false (não mentir)
    if (infusionCount > 0 && total === 0) {
      return { total: 0, infusionCount, known: false };
    }
    return { total, infusionCount, known: known || infusionCount === 0 };
  } catch {
    return { total: 0, infusionCount: 0, known: false };
  }
}

export function recommendedArForFractalLevel(level: number): number {
  if (level >= 100) return AR_THRESHOLDS.cm;
  if (level >= 75) return AR_THRESHOLDS.t4;
  if (level >= 50) return AR_THRESHOLDS.t3;
  return AR_THRESHOLDS.t1;
}
