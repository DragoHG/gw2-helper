import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { AccountSnapshot } from "@/lib/gw2/types";
import type { Recommendation } from "@/lib/recommend/types";
import {
  getDataDir,
  getDbPath,
  getLegacyDataDir,
  getSnapshotsDir,
  migrateLegacyDataIfNeeded,
} from "@/lib/db/paths";

let dbInstance: Database.Database | null = null;

function ensureDirs() {
  migrateLegacyDataIfNeeded();
  fs.mkdirSync(getDataDir(), { recursive: true });
  fs.mkdirSync(getSnapshotsDir(), { recursive: true });
}

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;
  ensureDirs();
  dbInstance = new Database(getDbPath());
  // DELETE evita arquivos -wal/-shm a mais; dados ficam fora do projeto de qualquer forma
  dbInstance.pragma("journal_mode = DELETE");
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      synced_at TEXT NOT NULL,
      account_name TEXT,
      account_id TEXT,
      file_path TEXT NOT NULL,
      summary_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_id INTEGER NOT NULL,
      mode TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(snapshot_id) REFERENCES snapshots(id)
    );

    CREATE INDEX IF NOT EXISTS idx_recommendations_snapshot
      ON recommendations(snapshot_id, mode);

    CREATE TABLE IF NOT EXISTS user_prefs (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pinned_achievements (
      achievement_id INTEGER PRIMARY KEY,
      pinned_at TEXT NOT NULL
    );
  `);
  return dbInstance;
}

export function getPref(key: string): string | null {
  const row = getDb()
    .prepare(`SELECT value FROM user_prefs WHERE key = ?`)
    .get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setPref(key: string, value: string) {
  getDb()
    .prepare(
      `INSERT INTO user_prefs (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run(key, value);
}

export function getSelectedCharacterName(
  fallback: string | null,
): string | null {
  return getPref("selected_character") ?? fallback;
}

export function setSelectedCharacterName(name: string) {
  setPref("selected_character", name);
}

export function getPinnedAchievementIds(): number[] {
  const rows = getDb()
    .prepare(`SELECT achievement_id FROM pinned_achievements ORDER BY pinned_at DESC`)
    .all() as Array<{ achievement_id: number }>;
  return rows.map((r) => r.achievement_id);
}

export function togglePinnedAchievement(id: number): boolean {
  const db = getDb();
  const existing = db
    .prepare(`SELECT 1 FROM pinned_achievements WHERE achievement_id = ?`)
    .get(id);
  if (existing) {
    db.prepare(`DELETE FROM pinned_achievements WHERE achievement_id = ?`).run(id);
    return false;
  }
  db.prepare(
    `INSERT INTO pinned_achievements (achievement_id, pinned_at) VALUES (?, ?)`,
  ).run(id, new Date().toISOString());
  return true;
}

export interface PrefsBackup {
  version: 1;
  exportedAt: string;
  selected_character: string | null;
  pinned_achievement_ids: number[];
}

/** Backup local de prefs - sem API key / snapshot / PII de conta. */
export function exportPrefsBackup(): PrefsBackup {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    selected_character: getPref("selected_character"),
    pinned_achievement_ids: getPinnedAchievementIds(),
  };
}

export function importPrefsBackup(raw: unknown): PrefsBackup {
  if (!raw || typeof raw !== "object") {
    throw new Error("Backup inválido");
  }
  const obj = raw as Record<string, unknown>;
  const selected =
    typeof obj.selected_character === "string"
      ? obj.selected_character
      : obj.selected_character === null
        ? null
        : null;
  const pins = Array.isArray(obj.pinned_achievement_ids)
    ? obj.pinned_achievement_ids
        .map((x) => Number(x))
        .filter((n) => Number.isFinite(n) && n > 0)
    : [];

  if (selected) setSelectedCharacterName(selected);
  else if (obj.selected_character === null) {
    getDb().prepare(`DELETE FROM user_prefs WHERE key = ?`).run("selected_character");
  }

  const db = getDb();
  db.prepare(`DELETE FROM pinned_achievements`).run();
  const insert = db.prepare(
    `INSERT INTO pinned_achievements (achievement_id, pinned_at) VALUES (?, ?)`,
  );
  const now = new Date().toISOString();
  for (const id of pins) insert.run(id, now);

  return exportPrefsBackup();
}

function resolveSnapshotPath(filePath: string): string {
  if (path.isAbsolute(filePath)) return filePath;

  const inNew = path.join(getDataDir(), filePath.replace(/^data[\\/]/, ""));
  if (fs.existsSync(inNew)) return inNew;

  const inLegacy = path.join(/*turbopackIgnore: true*/ process.cwd(), filePath);
  if (fs.existsSync(/*turbopackIgnore: true*/ inLegacy)) return inLegacy;

  // caminhos antigos: data/snapshots/foo.json
  const bare = path.join(getSnapshotsDir(), path.basename(filePath));
  return bare;
}

export function getLatestSnapshotRow(): {
  id: number;
  synced_at: string;
  account_name: string | null;
  account_id: string | null;
  file_path: string;
  summary_json: string;
} | null {
  const db = getDb();
  return (
    (db
      .prepare(
        `SELECT id, synced_at, account_name, account_id, file_path, summary_json
         FROM snapshots
         ORDER BY id DESC
         LIMIT 1`,
      )
      .get() as
      | {
          id: number;
          synced_at: string;
          account_name: string | null;
          account_id: string | null;
          file_path: string;
          summary_json: string;
        }
      | undefined) ?? null
  );
}

export function loadLatestSnapshot(): AccountSnapshot | null {
  const row = getLatestSnapshotRow();
  if (!row) return null;
  const absolute = resolveSnapshotPath(row.file_path);
  if (!fs.existsSync(/*turbopackIgnore: true*/ absolute)) return null;
  return JSON.parse(
    fs.readFileSync(/*turbopackIgnore: true*/ absolute, "utf8"),
  ) as AccountSnapshot;
}

export function saveSnapshot(
  snapshot: AccountSnapshot,
  recommendations: Recommendation[],
): { snapshotId: number; filePath: string } {
  ensureDirs();
  const db = getDb();
  const stamp = snapshot.syncedAt.replace(/[:.]/g, "-");
  const fileName = `snapshot-${stamp}.json`;
  const absolute = path.join(getSnapshotsDir(), fileName);

  fs.writeFileSync(absolute, JSON.stringify(snapshot, null, 2), "utf8");

  const summary = {
    accountName: snapshot.account.name,
    access: snapshot.account.access,
    characterCount: snapshot.characters.length,
    fractalLevel: snapshot.account.fractal_level ?? null,
    pvpRank: snapshot.pvp.stats?.pvp_rank ?? null,
    gold: snapshot.wallet.find((c) => c.id === 1)?.value ?? 0,
    recommendationCount: recommendations.length,
  };

  const insertSnapshot = db.prepare(`
    INSERT INTO snapshots (synced_at, account_name, account_id, file_path, summary_json)
    VALUES (@synced_at, @account_name, @account_id, @file_path, @summary_json)
  `);

  const insertRec = db.prepare(`
    INSERT INTO recommendations (snapshot_id, mode, payload_json, created_at)
    VALUES (@snapshot_id, @mode, @payload_json, @created_at)
  `);

  const tx = db.transaction(() => {
    const result = insertSnapshot.run({
      synced_at: snapshot.syncedAt,
      account_name: snapshot.account.name,
      account_id: snapshot.account.id,
      file_path: absolute,
      summary_json: JSON.stringify(summary),
    });
    const snapshotId = Number(result.lastInsertRowid);

    for (const mode of ["pve", "pvp", "all"] as const) {
      const payload =
        mode === "all"
          ? recommendations
          : recommendations.filter((r) => r.mode === mode);
      insertRec.run({
        snapshot_id: snapshotId,
        mode,
        payload_json: JSON.stringify(payload),
        created_at: snapshot.syncedAt,
      });
    }

    db.prepare(
      `INSERT INTO meta (key, value) VALUES ('latest_snapshot_id', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    ).run(String(snapshotId));

    return snapshotId;
  });

  const snapshotId = tx();
  return { snapshotId, filePath: absolute };
}

export function loadRecommendations(mode: "pve" | "pvp" | "all" = "all"): {
  snapshotId: number | null;
  syncedAt: string | null;
  recommendations: Recommendation[];
} {
  const row = getLatestSnapshotRow();
  if (!row) {
    return { snapshotId: null, syncedAt: null, recommendations: [] };
  }

  const db = getDb();
  const recRow = db
    .prepare(
      `SELECT payload_json FROM recommendations
       WHERE snapshot_id = ? AND mode = ?
       ORDER BY id DESC LIMIT 1`,
    )
    .get(row.id, mode) as { payload_json: string } | undefined;

  return {
    snapshotId: row.id,
    syncedAt: row.synced_at,
    recommendations: recRow
      ? (JSON.parse(recRow.payload_json) as Recommendation[])
      : [],
  };
}

export function getStatus() {
  const row = getLatestSnapshotRow();
  const hasKey = Boolean(process.env.GW2_API_KEY?.trim());
  return {
    hasApiKey: hasKey,
    dataDir: getDataDir(),
    legacyDataDir: getLegacyDataDir(),
    latestSnapshot: row
      ? {
          id: row.id,
          syncedAt: row.synced_at,
          accountName: row.account_name,
          summary: JSON.parse(row.summary_json) as Record<string, unknown>,
        }
      : null,
    dbPath: getDbPath(),
  };
}
