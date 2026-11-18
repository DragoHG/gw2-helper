import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env.local") });
config({ path: path.join(process.cwd(), ".env") });

const { gw2FetchMany } = await import("../src/lib/gw2/client.ts");
const { rankAchievements } = await import("../src/lib/achievements/analyze.ts");

const dir = path.join(process.env.LOCALAPPDATA, "gw2_helper");
const snapDir = path.join(dir, "snapshots");
const snaps = fs.readdirSync(snapDir).filter((f) => f.endsWith(".json")).sort();
const file = path.join(snapDir, snaps.at(-1));
const s = JSON.parse(fs.readFileSync(file, "utf8"));

const missing = new Set();
for (const ach of Object.values(s.achievementIndex || {})) {
  for (const r of ach.rewards || []) {
    if (r.type === "Item" && r.id && !s.itemsIndex?.[r.id]) missing.add(r.id);
  }
  for (const b of ach.bits || []) {
    if (b.type === "Item" && b.id && !s.itemsIndex?.[b.id]) missing.add(b.id);
  }
}

console.log("missing item ids", missing.size);
if (missing.size) {
  const items = await gw2FetchMany("/items", [...missing]);
  s.itemsIndex = s.itemsIndex || {};
  for (const it of items) s.itemsIndex[it.id] = it;
  fs.writeFileSync(file, JSON.stringify(s));
  console.log(
    "patched",
    items.slice(0, 8).map((i) => `${i.id}:${i.name}`).join(" | "),
  );
}

const top = rankAchievements(s, { mode: "pve", limit: 5, minPct: 0.05 });
for (const t of top) {
  console.log("---", t.name);
  console.log(" rewards:", t.rewardsSummary.join(", ") || "(none)");
  console.log(" next:", t.nextBits[0] || "(none)");
  console.log(" teleport:", t.teleportLabel || "-", t.chatLink || "");
}
