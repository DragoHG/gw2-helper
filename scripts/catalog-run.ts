import { config } from "dotenv";
import path from "node:path";

config({ path: path.join(process.cwd(), ".env.local") });
config({ path: path.join(process.cwd(), ".env") });

async function main() {
  const force = process.argv.includes("--force");
  const { refreshCatalog } = await import("../src/lib/catalog/refresh");
  const result = await refreshCatalog({ force });
  console.log(result);
  if (result.error && result.waypointCount === 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
