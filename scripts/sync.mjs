import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["tsx", "--tsconfig", "tsconfig.json", "scripts/sync-run.ts"],
  { stdio: "inherit", cwd: root, shell: true },
);
process.exit(result.status ?? 1);
