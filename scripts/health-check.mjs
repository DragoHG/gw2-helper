const pages = [
  "/",
  "/account",
  "/characters",
  "/gear",
  "/ascended",
  "/achievements",
  "/events",
  "/daily",
  "/vault",
  "/economy",
  "/legendaries",
  "/materials",
  "/masteries",
  "/craft",
  "/roadmap",
  "/pvp",
  "/info",
];
const apis = [
  "/api/status",
  "/api/recommendations?mode=pve",
  "/api/recommendations?mode=pvp",
  "/api/achievements?mode=pve&limit=3",
  "/api/events?hours=8",
  "/api/roadmap",
  "/api/snapshot",
  "/api/catalog/refresh",
  "/api/prefs/backup",
];

async function hit(path) {
  const res = await fetch(`http://localhost:3000${path}`);
  const text = await res.text();
  return { path, status: res.status, bytes: text.length };
}

const results = [];
for (const path of [...apis, ...pages]) {
  results.push(await hit(path));
}

const homeHits = [];
for (let i = 0; i < 5; i++) {
  const started = Date.now();
  const res = await fetch("http://localhost:3000/");
  homeHits.push({ status: res.status, ms: Date.now() - started });
  await new Promise((r) => setTimeout(r, 150));
}

console.log(JSON.stringify({ results, homeHits }, null, 2));
const failed = results.filter((r) => r.status >= 400);
if (failed.length) {
  console.error("FAIL", failed);
  process.exit(1);
}
console.log("OK all routes healthy");
