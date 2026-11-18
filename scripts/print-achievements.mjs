import { createRequire } from "node:module";
import path from "node:path";
import { register } from "node:module";

// Use tsx path via spawning is heavy; duplicate ease logic quickly on snapshot JSON.
import fs from "node:fs";

const file = fs
  .readdirSync("data/snapshots")
  .filter((f) => f.endsWith(".json"))
  .sort()
  .at(-1);
const s = JSON.parse(fs.readFileSync(`data/snapshots/${file}`, "utf8"));

function ease(current, max) {
  const remaining = Math.max(max - current, 0);
  const pct = current / max;
  return pct * 100 + 120 / (remaining + 1) + 30 / Math.sqrt(max);
}

const rows = s.achievements
  .filter((a) => !a.done && (a.max || 0) > 0 && (a.current || 0) > 0)
  .map((a) => {
    const def = s.achievementIndex?.[a.id];
    const flags = def?.flags || [];
    if (flags.includes("Daily") || flags.includes("Weekly") || flags.includes("Monthly")) {
      return null;
    }
    const current = a.current || 0;
    const max = a.max || 0;
    return {
      id: a.id,
      name: def?.name || `#${a.id}`,
      current,
      max,
      remaining: max - current,
      pct: current / max,
      ease: ease(current, max),
      pvp: flags.includes("Pvp"),
      category: (s.achievementCategories || []).find((c) =>
        (c.achievements || []).includes(a.id),
      )?.name,
    };
  })
  .filter(Boolean)
  .sort((a, b) => b.ease - a.ease);

console.log("indexed defs", Object.keys(s.achievementIndex || {}).length);
console.log("categories", (s.achievementCategories || []).length);
console.log("\nTOP 12 easiest:");
for (const r of rows.slice(0, 12)) {
  console.log(
    `${r.ease.toFixed(1)} | ${r.current}/${r.max} (-${r.remaining}) | ${r.pvp ? "PvP" : "PvE"} | ${r.name}`,
  );
}
