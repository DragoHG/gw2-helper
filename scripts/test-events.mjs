/**
 * Testes da engine de eventos (now fixo, snapshot sintético - sem PII real).
 */
import path from "node:path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env.local") });

const failures = [];
function ok(name, cond, detail = "") {
  if (cond) console.log(`PASS ${name}`);
  else {
    console.error(`FAIL ${name}${detail ? ` - ${detail}` : ""}`);
    failures.push(name);
  }
}

async function main() {
  const { refreshEventSchedule } = await import(
    "../src/lib/catalog/events-schedule.ts"
  );
  const { loadEventSchedule, loadCatalogMeta, saveCatalogMeta } = await import(
    "../src/lib/catalog/store.ts"
  );
  const { buildEventTimeline } = await import("../src/lib/events/timeline.ts");
  const { occurrencesForEvent } = await import("../src/lib/events/schedule.ts");
  const { scoreOccurrence } = await import("../src/lib/events/score.ts");

  console.log("Refreshing event schedule from wiki…");
  const sched = await refreshEventSchedule();
  ok("schedule.eventCount", sched.eventCount >= 20, String(sched.eventCount));
  ok("schedule.version", Boolean(sched.scheduleVersion));

  const meta = loadCatalogMeta();
  if (meta) {
    saveCatalogMeta({
      ...meta,
      eventCount: sched.eventCount,
      scheduleVersion: sched.scheduleVersion,
      scheduleRefreshedAt: new Date().toISOString(),
    });
  }

  const events = loadEventSchedule();
  const gjw = events.find((e) => /great jungle wurm/i.test(e.name));
  ok("schedule.hasJungleWurm", Boolean(gjw), gjw?.id);
  ok("schedule.jungleHasChatLink", Boolean(gjw?.chatLink));

  // now = 2026-11-18T12:00:00.000Z
  const now = Date.UTC(2026, 10, 18, 12, 0, 0);
  if (gjw) {
    const occs = occurrencesForEvent(gjw, now, 8);
    ok("occ.jungle.hasSome", occs.length >= 1, String(occs.length));
  }

  const fakeSnapshot = {
    syncedAt: new Date(now).toISOString(),
    tokenInfo: { id: "t", name: "t", permissions: [] },
    account: {
      id: "x",
      name: "Test.0001",
      world: 1,
      created: "2015-01-01T00:00:00Z",
      access: ["GuildWars2", "PathOfFire"],
      commander: false,
      fractal_level: 10,
    },
    characters: [
      {
        core: {
          name: "Hero",
          race: "Human",
          gender: "Male",
          profession: "Guardian",
          level: 80,
          age: 100,
          created: "2015-01-01T00:00:00Z",
          deaths: 0,
        },
        equipment: [],
      },
    ],
    bank: [],
    sharedInventory: [],
    materials: [],
    wallet: [],
    achievements: [
      {
        id: 8846,
        current: 1,
        max: 4,
        done: false,
        bits: [0],
      },
    ],
    masteries: [],
    masteryPoints: { totals: [], unlocked: [] },
    legendaryArmory: [],
    recipes: [],
    titles: [],
    skins: [],
    dyes: [],
    mounts: { types: ["raptor"], skins: [] },
    gliders: [],
    minis: [],
    finishers: [],
    novelties: [],
    outfits: [],
    home: { cats: [], nodes: [] },
    mapChests: [],
    worldBosses: ["shadow_behemoth"],
    dungeons: [],
    raids: [],
    pvp: { stats: null, standings: [], ranks: [] },
    itemsIndex: {},
    achievementIndex: {
      8846: {
        id: 8846,
        name: "Incursive Investigation: Threats to Tyria 1",
        requirement: "Defeat world bosses in major meta-events.",
        bits: [
          { type: "Text", text: "World Boss: Fire Elemental" },
          { type: "Text", text: "World Boss: Great Jungle Wurm" },
          { type: "Text", text: "World Boss: Shadow Behemoth" },
          { type: "Text", text: "World Boss: Svanir Shaman Chief" },
        ],
        flags: [],
        rewards: [],
      },
    },
    achievementCategories: [],
  };

  const timeline = buildEventTimeline(fakeSnapshot, {
    now,
    horizonHours: 8,
  });

  ok("timeline.primary", Boolean(timeline.primary), timeline.primary?.name);
  ok(
    "timeline.primaryNotShadowDaily",
    !/shadow behemoth/i.test(timeline.primary?.name ?? "") ||
      timeline.primary?.matchedGoalIds.some((id) => id.startsWith("ach-")),
    timeline.primary?.name,
  );
  ok(
    "timeline.noEoDIfMissing",
    ![timeline.primary, ...timeline.bridges, ...timeline.upcoming].some(
      (e) => e && e.expansion === "EndOfDragons",
    ),
  );
  ok(
    "timeline.primaryHasReason",
    (timeline.primary?.reasons?.length ?? 0) > 0,
  );

  // Access block: only PlayForFree
  const f2p = {
    ...fakeSnapshot,
    account: {
      ...fakeSnapshot.account,
      access: ["PlayForFree"],
    },
  };
  const t2 = buildEventTimeline(f2p, { now, horizonHours: 4 });
  ok(
    "f2p.noHotMeta",
    ![t2.primary, ...t2.bridges, ...t2.upcoming].some(
      (e) => e && e.expansion === "HeartOfThorns",
    ),
  );

  // score rejects unowned expansion
  const hotOcc = {
    eventId: "hot:1",
    name: "Octovine",
    groupName: "Auric Basin",
    category: "Heart of Thorns",
    kind: "meta",
    expansion: "HeartOfThorns",
    wikiQuery: "Octovine",
    startAt: now + 60000,
    endAt: now + 600000,
    minutesUntilStart: 1,
    minutesLeft: 10,
    isActive: false,
  };
  const blocked = scoreOccurrence(
    hotOcc,
    [],
    {
      raw: ["PlayForFree"],
      hasBaseGame: false,
      isFreeToPlayOnly: true,
      owned: [],
      missing: [
        "HeartOfThorns",
        "PathOfFire",
        "EndOfDragons",
        "SecretsOfTheObscure",
        "JanthirWilds",
        "VisionsOfEternity",
      ],
      displayOwned: [],
      highestOwned: null,
      summary: "F2P",
    },
    new Set(),
  );
  ok("score.blocksHotForF2P", blocked === null);

  // Festival fora de janela (kind festival sem calendário ativo em data fixa maio)
  const festOcc = {
    ...hotOcc,
    eventId: "fest:1",
    name: "Halloween Labyrinth",
    groupName: "Halloween",
    category: "Festival",
    kind: "festival",
    expansion: "core",
  };
  const festBlocked = scoreOccurrence(
    festOcc,
    [],
    {
      raw: ["GuildWars2"],
      hasBaseGame: true,
      isFreeToPlayOnly: false,
      owned: [],
      missing: [],
      displayOwned: ["Guild Wars 2 (base)"],
      highestOwned: null,
      summary: "base",
    },
    new Set(),
    Date.UTC(2026, 4, 15, 12, 0, 0), // maio - fora de Halloween
  );
  ok("score.festivalOutOfWindow", festBlocked === null);

  const { resolveAccountStage } = await import("../src/lib/gw2/stage.ts");
  const { buildPveRecommendations } = await import("../src/lib/recommend/pve.ts");
  const { buildAllRecommendations } = await import("../src/lib/recommend/index.ts");
  const { calculateAgonyResistance } = await import("../src/lib/fractals/ar.ts");
  const { VOE_ELITES } = await import("../src/lib/gw2/elites.ts");
  const { exportPrefsBackup, importPrefsBackup } = await import("../src/lib/db/index.ts");

  ok("elites.voe.mesmer", VOE_ELITES.Mesmer?.id === 73);

  const ar = calculateAgonyResistance(fakeSnapshot, fakeSnapshot.characters[0]);
  ok("ar.safe", typeof ar.total === "number");

  const stagePof = resolveAccountStage(fakeSnapshot);
  ok(
    "stage.pof.notF2p",
    stagePof.stage !== "f2p",
    stagePof.stage,
  );
  const stageF2p = resolveAccountStage(f2p);
  ok("stage.f2p", stageF2p.stage === "f2p", stageF2p.stage);

  const voeSnap = {
    ...fakeSnapshot,
    account: {
      ...fakeSnapshot.account,
      access: ["GuildWars2", "PathOfFire", "VisionsOfEternity"],
    },
  };
  try {
    const recsVoe = buildPveRecommendations(voeSnap);
    ok("recs.voe.ok", Array.isArray(recsVoe) && recsVoe.length >= 1);
    ok(
      "recs.voe.mentionsEliteOrMastery",
      recsVoe.some((r) => /VoE|Troubadour|Luminary|Castora|Visions/i.test(r.title + r.how)),
    );
  } catch (e) {
    ok("recs.voe.ok", false, String(e));
  }

  let recsPof = [];
  let recsF2p = [];
  try {
    recsPof = buildPveRecommendations(fakeSnapshot);
    ok("recs.pof.ok", recsPof.length >= 1, String(recsPof.length));
  } catch (e) {
    ok("recs.pof.ok", false, String(e));
  }
  try {
    recsF2p = buildAllRecommendations(f2p);
    ok("recs.f2p.ok", Array.isArray(recsF2p), String(recsF2p.length));
    ok(
      "recs.f2p.noHotElitePush",
      !recsF2p.some((r) => /elite HoT|Dragonhunter|Verdant Brink/i.test(r.title)),
    );
    ok(
      "recs.f2p.noVoeElite",
      !recsF2p.some((r) => /elite VoE|Troubadour/i.test(r.title)),
    );
  } catch (e) {
    ok("recs.f2p.ok", false, String(e));
  }

  try {
    const backup = exportPrefsBackup();
    ok("prefs.export.version", backup.version === 1);
    const round = importPrefsBackup(backup);
    ok("prefs.import.roundtrip", round.version === 1);
  } catch (e) {
    ok("prefs.export.version", false, String(e));
  }

  // Living World: sem progresso não deve passar no filtro
  const { achievementAllowedForAccount } = await import(
    "../src/lib/achievements/expansion.ts"
  );
  const lwSnap = {
    ...fakeSnapshot,
    achievements: [
      { id: 9001, current: 0, max: 5, done: false },
      { id: 9002, current: 2, max: 5, done: false },
    ],
    achievementIndex: {
      9001: {
        id: 9001,
        name: "Icebrood Saga Intro",
        requirement: "Explore Bjora Marches",
        flags: [],
        rewards: [],
      },
      9002: {
        id: 9002,
        name: "Drakkar Slayer",
        requirement: "Defeat Drakkar in Bjora Marches",
        flags: [],
        rewards: [],
      },
    },
  };
  ok(
    "lw.blockUntouched",
    achievementAllowedForAccount(
      lwSnap,
      lwSnap.achievementIndex[9001],
      "Icebrood Saga",
    ) === false,
  );
  ok(
    "lw.allowInProgress",
    achievementAllowedForAccount(
      lwSnap,
      lwSnap.achievementIndex[9002],
      "Icebrood Saga",
    ) === true,
  );

  if (failures.length) {
    console.error(`\n${failures.length} FAIL`);
    process.exit(1);
  }
  console.log("\nOK events engine");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
