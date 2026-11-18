import { normalizeCatalogText } from "@/lib/catalog/normalize";
import { rankAchievements } from "@/lib/achievements/analyze";
import { hasExpansion } from "@/lib/gw2/access";
import { getFocusedCharacter } from "@/lib/gw2/focus";
import type { AccountSnapshot } from "@/lib/gw2/types";
import type { ProgressGoal } from "@/lib/events/types";
import { parseVaultTracks } from "@/lib/vault/parse";

const WB_NAME_FROM_API: Record<string, string> = {
  admiral_taidha_covington: "Admiral Taidha Covington",
  svanir_shaman_chief: "Svanir Shaman Chief",
  megadestroyer: "Megadestroyer",
  fire_elemental: "Fire Elemental",
  shatterer: "The Shatterer",
  great_jungle_wurm: "Great Jungle Wurm",
  modniir_ulgoth: "Modniir Ulgoth",
  shadow_behemoth: "Shadow Behemoth",
  claw_of_jormag: "Claw of Jormag",
  inquest_golem_mark_ii: "Golem Mark II",
  tequatl_the_sunless: "Tequatl the Sunless",
  karka_queen: "Karka Queen",
  triple_trouble: "Triple Trouble",
  drakkar: "Drakkar",
};

function keysForLabel(...parts: string[]): string[] {
  const out = new Set<string>();
  for (const p of parts) {
    const n = normalizeCatalogText(p);
    if (!n) continue;
    out.add(n);
    out.add(n.replace(/^world boss\s+/, ""));
    out.add(n.replace(/^kill\s+|^defeat\s+|^slay\s+|^destroy\s+/i, ""));
  }
  return [...out];
}

/** Metas do momento atual da conta (+ peso leve do personagem focado). */
export function extractProgressGoals(
  snapshot: AccountSnapshot,
): ProgressGoal[] {
  const goals: ProgressGoal[] = [];
  try {
    const doneWb = new Set(
      (snapshot.worldBosses ?? []).map((id) => id.toLowerCase()),
    );

    const ranked = rankAchievements(snapshot, {
      mode: "pve",
      limit: 40,
      minPct: 0,
      includeZero: true,
    });
    for (const ach of ranked) {
      for (const bit of ach.nextBits) {
        const cleaned = bit.replace(/^World Boss:\s*/i, "").trim();
        if (
          !cleaned ||
          cleaned.startsWith("Item") ||
          cleaned.startsWith("Skin")
        ) {
          continue;
        }
        const isWb =
          /^World Boss:/i.test(bit) ||
          /wurm|elemental|behemoth|tequatl|shatterer|ulgoth|jormag|taidha|svanir|megadestroyer|karka|triple trouble/i.test(
            cleaned,
          );
        goals.push({
          id: `ach-${ach.id}-${normalizeCatalogText(bit)}`,
          kind: "achievement_bit",
          label: `${ach.name}: ${bit}`,
          matchKeys: keysForLabel(bit, cleaned, ach.name),
          weight: isWb ? 100 : 80,
          achievementId: ach.id,
        });
      }
    }

    // Vault objectives que casem com nomes de eventos
    try {
      for (const track of parseVaultTracks(snapshot)) {
        for (const obj of track.objectives) {
          if (obj.claimed) continue;
          const title = obj.title?.trim();
          if (!title || title.length < 4) continue;
          goals.push({
            id: `vault-${track.key}-${obj.id}`,
            kind: "generic",
            label: `Vault: ${title}`,
            matchKeys: keysForLabel(title),
            weight: track.key === "daily" ? 55 : 35,
          });
        }
      }
    } catch {
      /* vault ausente / shape diferente */
    }

    for (const [apiId, name] of Object.entries(WB_NAME_FROM_API)) {
      if (doneWb.has(apiId)) continue;
      goals.push({
        id: `wb-daily-${apiId}`,
        kind: "world_boss_daily",
        label: `Daily: ${name}`,
        matchKeys: keysForLabel(name, `World Boss ${name}`),
        weight: 40,
        worldBossApiId: apiId,
      });
    }

    const mounts = new Set(
      (snapshot.mounts?.types ?? []).map((m) => m.toLowerCase()),
    );

    if (hasExpansion(snapshot, "PathOfFire") && !mounts.has("jackal")) {
      goals.push({
        id: "mount-jackal",
        kind: "mount_progress",
        label: "Unlock Jackal (PoF)",
        matchKeys: keysForLabel(
          "Crystal Oasis",
          "Desert Highlands",
          "Elon Riverlands",
          "Path of Fire",
        ),
        weight: 25,
      });
    }

    if (hasExpansion(snapshot, "SecretsOfTheObscure") && !mounts.has("skyscale")) {
      goals.push({
        id: "mount-skyscale",
        kind: "mount_progress",
        label: "Unlock Skyscale (SotO)",
        matchKeys: keysForLabel(
          "Skywatch Archipelago",
          "Amnytas",
          "Inner Nayos",
          "Skyscale",
        ),
        weight: 30,
      });
    }

    const byRegion = Object.fromEntries(
      (snapshot.masteryPoints?.totals ?? []).map((t) => [t.region, t]),
    );
    if (hasExpansion(snapshot, "HeartOfThorns")) {
      const hot = byRegion["Heart of Thorns"] ?? byRegion["Maguuma"];
      if ((hot?.spent ?? 0) < 19) {
        goals.push({
          id: "mastery-hot",
          kind: "mastery_progress",
          label: "Masteries HoT",
          matchKeys: keysForLabel(
            "Verdant Brink",
            "Auric Basin",
            "Tangled Depths",
            "Dragon's Stand",
            "Heart of Thorns",
          ),
          weight: 25,
        });
      }
    }
    if (hasExpansion(snapshot, "EndOfDragons")) {
      const eod =
        byRegion["End of Dragons"] ??
        byRegion["Cantha"] ??
        byRegion["Jade Sea"];
      if ((eod?.spent ?? 0) < 10) {
        goals.push({
          id: "mastery-eod",
          kind: "mastery_progress",
          label: "Masteries EoD",
          matchKeys: keysForLabel(
            "Seitung Province",
            "New Kaineng",
            "Dragon's End",
            "Echovald",
            "End of Dragons",
          ),
          weight: 25,
        });
      }
    }
    if (hasExpansion(snapshot, "SecretsOfTheObscure")) {
      const soto =
        byRegion["Secrets of the Obscure"] ?? byRegion["Horn of Maguuma"];
      if ((soto?.spent ?? 0) < 8) {
        goals.push({
          id: "mastery-soto",
          kind: "mastery_progress",
          label: "Masteries SotO",
          matchKeys: keysForLabel(
            "Skywatch Archipelago",
            "Amnytas",
            "Inner Nayos",
          ),
          weight: 25,
        });
      }
    }

    if (hasExpansion(snapshot, "VisionsOfEternity")) {
      goals.push({
        id: "mastery-voe",
        kind: "mastery_progress",
        label: "Masteries VoE",
        matchKeys: keysForLabel("Castora", "Starlit Weald", "Visions of Eternity"),
        weight: 28,
      });
    }

    const focused = getFocusedCharacter(snapshot);
    if (focused && focused.core.level < 80) {
      goals.push({
        id: "leveling-core",
        kind: "generic",
        label: "Leveling / WB fáceis",
        matchKeys: keysForLabel(
          "Shadow Behemoth",
          "Fire Elemental",
          "Great Jungle Wurm",
          "Svanir Shaman Chief",
        ),
        weight: 15,
      });
    }
  } catch (err) {
    console.error("extractProgressGoals failed", err);
  }

  return goals;
}

export function eventMatchesGoal(
  eventName: string,
  groupName: string,
  goal: ProgressGoal,
): boolean {
  const blob = normalizeCatalogText(`${eventName} ${groupName}`);
  return goal.matchKeys.some(
    (k) => k.length >= 4 && (blob.includes(k) || k.includes(blob)),
  );
}
