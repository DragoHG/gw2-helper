import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/** Dados fora do projeto para o Turbopack não observar SQLite/JSON (evita reload infinito). */
export function getDataDir(): string {
  if (process.env.GW2_HELPER_DATA?.trim()) {
    return path.resolve(process.env.GW2_HELPER_DATA.trim());
  }
  if (process.platform === "win32") {
    const base =
      process.env.LOCALAPPDATA ||
      path.join(os.homedir(), "AppData", "Local");
    return path.join(base, "gw2_helper");
  }
  return path.join(os.homedir(), ".gw2_helper");
}

export function getLegacyDataDir(): string {
  return path.join(process.cwd(), "data");
}

export function getDbPath(): string {
  return path.join(getDataDir(), "gw2.db");
}

export function getSnapshotsDir(): string {
  return path.join(getDataDir(), "snapshots");
}

export function getCatalogDir(): string {
  return path.join(getDataDir(), "catalog");
}

export function migrateLegacyDataIfNeeded() {
  const legacy = getLegacyDataDir();
  const next = getDataDir();
  const legacyDb = path.join(legacy, "gw2.db");
  const nextDb = path.join(next, "gw2.db");

  fs.mkdirSync(next, { recursive: true });
  fs.mkdirSync(path.join(next, "snapshots"), { recursive: true });

  if (fs.existsSync(nextDb) || !fs.existsSync(legacyDb)) {
    return;
  }

  fs.copyFileSync(legacyDb, nextDb);
  for (const suffix of ["-wal", "-shm"]) {
    const src = `${legacyDb}${suffix}`;
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, `${nextDb}${suffix}`);
    }
  }

  const legacySnapshots = path.join(legacy, "snapshots");
  if (fs.existsSync(legacySnapshots)) {
    for (const file of fs.readdirSync(legacySnapshots)) {
      if (!file.endsWith(".json")) continue;
      const dest = path.join(next, "snapshots", file);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(path.join(legacySnapshots, file), dest);
      }
    }
  }
}
