import { config } from "dotenv";
import path from "node:path";

config({ path: path.join(process.cwd(), ".env.local") });
config({ path: path.join(process.cwd(), ".env") });

async function main() {
  const { refreshCatalog } = await import("../src/lib/catalog/refresh");
  const { syncAccount } = await import("../src/lib/gw2/sync");
  const { buildAllRecommendations } = await import("../src/lib/recommend");
  const { saveSnapshot } = await import("../src/lib/db");

  console.log("Atualizando catálogo do jogo...");
  const catalog = await refreshCatalog();
  console.log(
    `Catálogo: build ${catalog.buildId}, waypoints ${catalog.waypointCount}, updated=${catalog.updated}${catalog.error ? ` err=${catalog.error}` : ""}`,
  );

  console.log("Iniciando sync GW2...");
  const snapshot = await syncAccount();
  const recommendations = buildAllRecommendations(snapshot);
  const saved = saveSnapshot(snapshot, recommendations);

  const { resolveAccountAccess } = await import("../src/lib/gw2/access");
  const access = resolveAccountAccess(snapshot.account.access);

  console.log("OK");
  console.log(`Conta: ${snapshot.account.name}`);
  console.log(`Access (API): ${snapshot.account.access.join(", ")}`);
  console.log(`Access (real): ${access.summary}`);
  console.log(`Chars: ${snapshot.characters.map((c) => c.core.name).join(", ")}`);
  console.log(`Snapshot: #${saved.snapshotId} -> ${saved.filePath}`);
  console.log(
    `Recomendações: ${recommendations.length} (PvE ${recommendations.filter((r) => r.mode === "pve").length} / PvP ${recommendations.filter((r) => r.mode === "pvp").length})`,
  );
  console.log("\nTop 8:");
  for (const rec of recommendations.slice(0, 8)) {
    console.log(`- [${rec.mode}] (${rec.score}) ${rec.title}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
