import { config } from "dotenv";
import path from "node:path";

config({ path: path.join(process.cwd(), ".env.local") });

async function main() {
  const { loadLatestSnapshot, saveSnapshot } = await import("../src/lib/db");
  const { buildAllRecommendations } = await import("../src/lib/recommend");
  const snapshot = loadLatestSnapshot();
  if (!snapshot) throw new Error("Sem snapshot");
  const recommendations = buildAllRecommendations(snapshot);
  const saved = saveSnapshot(snapshot, recommendations);
  console.log(`Rebuilt #${saved.snapshotId} with ${recommendations.length} recs`);
  for (const r of recommendations.slice(0, 10)) {
    console.log(`[${r.mode}] ${r.score} ${r.title}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
