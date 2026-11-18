import { pathToFileURL } from "node:url";
import path from "node:path";

// Load via tsx register by spawning is easier - use dynamic import of compiled path
const root = path.resolve(import.meta.dirname, "..");

async function main() {
  // Use child approach: import after registering tsx
  const { register } = await import("node:module");
  try {
    register("tsx/esm", pathToFileURL("./"));
  } catch {
    // ignore
  }

  const { refreshCatalog } = await import(
    pathToFileURL(path.join(root, "src/lib/catalog/refresh.ts")).href
  );
  const { findNearestWaypoint } = await import(
    pathToFileURL(path.join(root, "src/lib/geo/waypoints.ts")).href
  );

  const r = await refreshCatalog({ force: true });
  console.log("catalog", r);

  const hints = [
    "World Boss: Great Jungle Wurm",
    "Caledon Forest: Quetzal Bay",
    "Destiny's Ascent",
    "Maculate Fringe",
    "World Boss: Shadow Behemoth",
    "World Boss: Fire Elemental",
  ];
  for (const hint of hints) {
    const m = findNearestWaypoint([hint]);
    console.log(
      hint,
      "=>",
      m
        ? `${m.waypoint.name} @ ${m.waypoint.mapName} ${m.waypoint.chatLink} [${m.reason}] score=${m.score}`
        : "NULL",
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
