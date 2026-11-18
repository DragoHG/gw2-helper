import type { ExpansionId } from "@/lib/gw2/access";
import { accountAccessFromSnapshot } from "@/lib/gw2/access";
import type { AccountSnapshot, AchievementDefinition } from "@/lib/gw2/types";
import {
  accountTouchedLivingWorld,
  matchLivingWorldEpisode,
} from "@/lib/living-world/episodes";
import { getFocusedCharacter } from "@/lib/gw2/focus";

/** Infere expansão exigida a partir de categoria/nome/requirement/bits. */
export function inferAchievementExpansion(input: {
  name?: string;
  requirement?: string;
  categoryName?: string;
  bits?: string[];
  flags?: string[];
}): ExpansionId | "core" | "living_world" | "unknown" {
  const blob = [
    input.name,
    input.requirement,
    input.categoryName,
    ...(input.bits ?? []),
    ...(input.flags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    /visions of eternity|castora|starlit weald|shipwreck strand|leyspring|eternity.s garden/.test(
      blob,
    )
  )
    return "VisionsOfEternity";
  if (/janthir|lowland shore|janthir syntri|mistburned/.test(blob))
    return "JanthirWilds";
  if (
    /secrets of the obscure|soto|skywatch|amnytas|inner nayos|convergence|skyscale/.test(
      blob,
    )
  )
    return "SecretsOfTheObscure";
  if (
    /end of dragons|eod|cantha|seitung|new kaiteng|dragon'?s end|echovald|gyala|jade sea|arborstone/.test(
      blob,
    )
  )
    return "EndOfDragons";
  if (
    /path of fire|pof|crystal oasis|desert highlands|elon riverlands|the desolation|domain of vabbi|jahai|thunderhead|domain of ista/.test(
      blob,
    )
  )
    return "PathOfFire";
  if (
    /heart of thorns|hot|verdant brink|auric basin|tangled depths|dragon'?s stand|bloodstone fen|ember bay|draconis|siren'?s landing/.test(
      blob,
    )
  )
    return "HeartOfThorns";

  if (
    matchLivingWorldEpisode(blob) ||
    /living world|living story|season [1-5]|lw[1-5]|icebrood|bound by blood|whisper in the dark|jormag rising|champions|flashpoint|daybreak|war eternal|lws4|lws3|lws2/.test(
      blob,
    )
  ) {
    return "living_world";
  }

  return "core";
}

export function achievementAllowedForAccount(
  snapshot: AccountSnapshot,
  def: AchievementDefinition | undefined,
  categoryName?: string,
  nextBits: string[] = [],
): boolean {
  const inferred = inferAchievementExpansion({
    name: def?.name,
    requirement: def?.requirement,
    categoryName,
    bits: nextBits,
    flags: def?.flags,
  });
  if (inferred === "core" || inferred === "unknown") return true;

  if (inferred === "living_world") {
    // Só sugerir se a conta JÁ tem progresso neste achievement (ou quest conhecida).
    // API lista achievements “tocados”; current===0 sem bits = unlocked mas não iniciado -
    // para LW isso ainda pode ser episódio comprado. Exigimos current>0 OU bits iniciados
    // para não empurrar episódios só pelo nome.
    const progress = (snapshot.achievements ?? []).find((a) => a.id === def?.id);
    const hasProgress =
      (progress?.current ?? 0) > 0 ||
      ((progress?.bits?.length ?? 0) > 0 && !progress?.done);
    const focused = getFocusedCharacter(snapshot);
    const questIds = [
      ...(focused?.quests ?? []),
      ...snapshot.characters.flatMap((c) => c.quests ?? []),
    ];
    const blob = `${def?.name ?? ""} ${categoryName ?? ""} ${def?.requirement ?? ""}`;
    const ep = matchLivingWorldEpisode(blob);
    return accountTouchedLivingWorld({
      hasProgress,
      questIds,
      episode: ep,
    });
  }

  return accountAccessFromSnapshot(snapshot).owned.includes(inferred);
}
