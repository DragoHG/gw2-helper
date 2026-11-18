/**
 * Smoke + asserts funcionais (sem imprimir dados sensíveis de conta).
 * Requer: npm run dev em :3000 e snapshot já sincronizado (ou rode npm run sync antes).
 */
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env.local") });
config({ path: path.join(process.cwd(), ".env") });

const BASE = process.env.SMOKE_BASE ?? "http://localhost:3000";
const dataDir =
  process.env.GW2_HELPER_DATA ||
  path.join(process.env.LOCALAPPDATA || "", "gw2_helper");

const failures = [];
function ok(name, cond, detail = "") {
  if (cond) console.log(`PASS ${name}`);
  else {
    console.error(`FAIL ${name}${detail ? ` - ${detail}` : ""}`);
    failures.push(name);
  }
}

async function hit(pathname, init) {
  const res = await fetch(`${BASE}${pathname}`, init);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* html */
  }
  return { status: res.status, text, json, bytes: text.length };
}

async function main() {
  console.log("Smoke GW2 Helper @", BASE);

  // --- catálogo local ---
  const metaPath = path.join(dataDir, "catalog", "meta.json");
  const objPath = path.join(dataDir, "catalog", "objective-waypoints.json");
  const wpPath = path.join(dataDir, "catalog", "waypoints.json");
  const secPath = path.join(dataDir, "catalog", "sectors.json");
  ok("catalog/meta.json", fs.existsSync(metaPath));
  ok("catalog/waypoints.json", fs.existsSync(wpPath));
  ok("catalog/sectors.json", fs.existsSync(secPath));
  ok("catalog/objective-waypoints.json", fs.existsSync(objPath));
  const evPath = path.join(dataDir, "catalog", "events-schedule.json");
  ok("catalog/events-schedule.json", fs.existsSync(evPath));

  if (fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    ok("catalog.buildId", Number(meta.buildId) > 0, String(meta.buildId));
    ok("catalog.waypoints>=500", (meta.waypointCount ?? 0) >= 500);
    ok("catalog.sectors>=1000", (meta.sectorCount ?? 0) >= 1000);
    ok("catalog.objectives>=1000", (meta.objectiveCount ?? 0) >= 1000);
    ok("catalog.events>=20", (meta.eventCount ?? 0) >= 20, String(meta.eventCount));
    ok(
      "catalog.wvwRanks",
      (meta.wvwRankCount ?? 0) >= 50 ||
        fs.existsSync(path.join(dataDir, "catalog", "wvw-ranks.json")),
      String(meta.wvwRankCount ?? 0),
    );
  }

  // --- índice objetivo → WP (sem PII) ---
  const { findNearestWaypoint } = await import("../src/lib/geo/waypoints.ts");
  const cases = [
    ["World Boss: Great Jungle Wurm", /wychmire/i],
    ["World Boss: Shadow Behemoth", /godslost/i],
    ["Maculate Fringe", /kormir|maculate|crystal/i],
    ["Destiny's Ascent", /destiny/i],
  ];
  for (const [hint, re] of cases) {
    const m = findNearestWaypoint([hint]);
    ok(
      `wp:${hint}`,
      Boolean(
        m?.waypoint?.chatLink &&
          re.test(`${m.waypoint.name} ${m.reason ?? ""} ${m.waypoint.mapName}`),
      ),
      m ? `${m.waypoint.name} @ ${m.waypoint.mapName}` : "null",
    );
  }

  // --- acesso / achievements (snapshot local, sem printar nomes) ---
  const { loadLatestSnapshot } = await import("../src/lib/db/index.ts");
  const { resolveAccountAccess } = await import("../src/lib/gw2/access.ts");
  const { rankAchievements } = await import("../src/lib/achievements/analyze.ts");
  const { resolveAccountStage } = await import("../src/lib/gw2/stage.ts");
  const { parseVaultTracks } = await import("../src/lib/vault/parse.ts");
  const { buildPveRecommendations } = await import("../src/lib/recommend/pve.ts");
  const { worldBossDisplayName } = await import(
    "../src/lib/recommend/daily-actions.ts"
  );

  const snap = loadLatestSnapshot();
  ok("snapshot.exists", Boolean(snap));
  if (snap) {
    const access = resolveAccountAccess(snap.account.access);
    ok("access.notFreeOnlyIfGuildWars2", !(access.hasBaseGame && access.isFreeToPlayOnly));
    ok("access.displayOwned", access.displayOwned.length > 0);
    if (snap.account.access.includes("PathOfFire")) {
      ok("access.pofImpliesHot", access.owned.includes("HeartOfThorns"));
    }

    const stage = resolveAccountStage(snap);
    ok(
      "stage.valid",
      ["f2p", "leveling", "core80", "ascended", "endgame"].includes(stage.stage),
      stage.stage,
    );
    ok("stage.label", Boolean(stage.label));

    // Vault parse nunca deve lançar (key sem scope / season vazia)
    let vaultTracks = [];
    try {
      vaultTracks = parseVaultTracks(snap);
      ok("vault.parse", true);
    } catch (e) {
      ok("vault.parse", false, String(e));
    }

    const top = rankAchievements(snap, { mode: "pve", limit: 5, minPct: 0.05 });
    const starters = rankAchievements(snap, {
      mode: "pve",
      limit: 5,
      minPct: 0,
      includeZero: true,
    });
    ok("ach.top5.orStarters", top.length + starters.length >= 1);
    const rewardUgly = [...top, ...starters].some((t) =>
      t.rewardsSummary.some((r) => /^item #\d+/i.test(r)),
    );
    ok("ach.rewards.named", !rewardUgly);

    const withBits = top.filter((t) => t.nextBits[0]);
    const withTp = withBits.filter((t) => t.chatLink);
    ok(
      "ach.bitsHaveTeleportOften",
      withBits.length === 0 || withTp.length / withBits.length >= 0.4,
      `${withTp.length}/${withBits.length}`,
    );

    let recs = [];
    try {
      recs = buildPveRecommendations(snap);
      ok("recs.pve.builds", Array.isArray(recs) && recs.length >= 1, String(recs.length));
    } catch (e) {
      ok("recs.pve.builds", false, String(e));
    }
    if (vaultTracks.some((t) => t.objectives.some((o) => !o.claimed))) {
      ok(
        "recs.includeVaultWhenOpen",
        recs.some((r) => r.category === "vault" || /vault/i.test(r.id)),
      );
    }
    try {
      const { buildPvpRecommendations } = await import(
        "../src/lib/recommend/pvp.ts"
      );
      const pvpRecs = buildPvpRecommendations(snap);
      ok("recs.pvp.builds", Array.isArray(pvpRecs) && pvpRecs.length >= 1);
      ok(
        "recs.wvw.present",
        pvpRecs.some((r) => r.category === "wvw" || /wvw/i.test(r.id)),
      );
    } catch (e) {
      ok("recs.pvp.builds", false, String(e));
    }
    ok(
      "wb.displayName",
      worldBossDisplayName("great_jungle_wurm").toLowerCase().includes("jungle"),
    );

    const { planLegendaries } = await import("../src/lib/legendaries/planner.ts");
    const { calculateAgonyResistance } = await import("../src/lib/fractals/ar.ts");
    const legs = planLegendaries(snap, 3);
    ok("legendaries.plan", Array.isArray(legs));
    const ar = calculateAgonyResistance(snap, snap.characters?.[0]);
    ok("ar.calc", typeof ar.total === "number");

    const prefsGet = await hit("/api/prefs/backup");
    ok("api.prefs.backup", prefsGet.status < 400 && prefsGet.json?.version === 1);

    ok("chars.present", snap.characters.length >= 1);
    ok("itemsIndex.present", Object.keys(snap.itemsIndex || {}).length > 0);
  }

  // --- rotas HTTP ---
  const pages = [
    "/",
    "/account",
    "/characters",
    "/gear",
    "/ascended",
    "/achievements",
    "/events",
    "/daily",
    "/vault",
    "/economy",
    "/legendaries",
    "/materials",
    "/masteries",
    "/craft",
    "/roadmap",
    "/pvp",
    "/info",
  ];
  const apis = [
    "/api/status",
    "/api/recommendations?mode=pve",
    "/api/recommendations?mode=pvp",
    "/api/achievements?mode=pve&limit=5",
    "/api/roadmap",
    "/api/snapshot",
    "/api/catalog/refresh",
    "/api/prefs/backup",
  ];

  for (const p of [...apis, ...pages]) {
    const r = await hit(p);
    ok(`http ${p}`, r.status < 400, `status=${r.status}`);
  }

  const achApi = await hit("/api/achievements?mode=pve&limit=5");
  if (achApi.json?.easiest?.length) {
    const first = achApi.json.easiest[0];
    ok("api.ach.hasName", Boolean(first.name));
    ok(
      "api.ach.noRawItemHashInRewards",
      !(first.rewardsSummary || []).some((r) => /^item #\d+/i.test(r)),
    );
  }

  const catGet = await hit("/api/catalog/refresh");
  ok("api.catalog.meta", Boolean(catGet.json?.meta?.buildId));

  const eventsApi = await hit("/api/events?hours=8");
  ok("api.events", eventsApi.status < 400, `status=${eventsApi.status}`);
  if (eventsApi.json) {
    ok(
      "api.events.disclaimer",
      typeof eventsApi.json.disclaimer === "string",
    );
    ok(
      "api.events.hasTimeline",
      eventsApi.json.primary != null ||
        (eventsApi.json.bridges?.length ?? 0) > 0 ||
        (eventsApi.json.upcoming?.length ?? 0) > 0,
    );
    if (eventsApi.json.primary) {
      ok(
        "api.events.primaryChatOrName",
        Boolean(eventsApi.json.primary.name),
      );
    }
  }

  const eventsPage = await hit("/events");
  ok("http /events", eventsPage.status < 400, `status=${eventsPage.status}`);

  const roadmapApi = await hit("/api/roadmap");
  ok("api.roadmap", roadmapApi.status < 400, `status=${roadmapApi.status}`);
  if (roadmapApi.json) {
    ok("api.roadmap.stage", Boolean(roadmapApi.json.stageLabel));
    ok(
      "api.roadmap.timeline",
      Array.isArray(roadmapApi.json.timeline) &&
        roadmapApi.json.timeline.length > 0,
    );
    const first = roadmapApi.json.timeline?.[0];
    if (first) {
      ok("api.roadmap.stepFields", Boolean(first.title && first.why && first.how));
    }
  }

  const roadmapPage = await hit("/roadmap");
  ok("http /roadmap", roadmapPage.status < 400, `status=${roadmapPage.status}`);

  // home timing sanity
  const t0 = Date.now();
  await hit("/");
  ok("home.under5s", Date.now() - t0 < 5000, `${Date.now() - t0}ms`);

  if (failures.length) {
    console.error(`\n${failures.length} FAIL(s)`);
    process.exit(1);
  }
  console.log("\nOK smoke passed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
