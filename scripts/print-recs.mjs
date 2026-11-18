import Database from "better-sqlite3";

const db = new Database("data/gw2.db");
for (const mode of ["pve", "pvp"]) {
  const row = db
    .prepare(
      "SELECT payload_json FROM recommendations WHERE mode = ? ORDER BY id DESC LIMIT 1",
    )
    .get(mode);
  const recs = JSON.parse(row.payload_json);
  console.log(`\n=== ${mode.toUpperCase()} ===`);
  for (const r of recs) {
    console.log(`[${r.priority}] ${r.score} - ${r.title}`);
  }
}
