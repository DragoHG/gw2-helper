import { findNearestWaypoint } from "@/lib/geo/waypoints";
import { wikiSearch } from "@/lib/wiki";

/** Dicas de onde cumprir objetivos comuns do Wizard's Vault. */
const VAULT_HINTS: Array<{
  match: string[];
  how: string;
  where: string;
  wpHints: string[];
  wiki: string;
}> = [
  {
    match: ["fractal", "mistlock"],
    how: "Entre no portal de Fractals em Lion's Arch. Use LFG (W) → Fractals → T1 se for iniciante.",
    where: "Lion's Arch - Mistlock Observatory / portal de Fractals.",
    wpHints: ["Lion's Arch", "Mistlock"],
    wiki: "Fractals of the Mists",
  },
  {
    match: ["world boss", "world bosses"],
    how: "Veja Eventos para o próximo world boss com horário e waypoint. Entre no LFG se precisar de mapa cheio.",
    where: "Mapa do world boss da vez (timeline em Eventos).",
    wpHints: ["Lion's Arch"],
    wiki: "World boss",
  },
  {
    match: ["meta-event", "meta event", "map meta"],
    how: "Vá ao mapa da meta, siga o marcador de evento e fique até o fim. Abra LFG (W) se o mapa estiver vazio.",
    where: "Mapa da meta - use Eventos para horário + teleport.",
    wpHints: ["Lion's Arch"],
    wiki: "Meta event",
  },
  {
    match: ["strike", "mission"],
    how: "Abra LFG (W) → Strikes. Entre em qualquer grupo público do strike pedido.",
    where: "Eye of the North (portal) ou instância do strike.",
    wpHints: ["Eye of the North", "Lion's Arch"],
    wiki: "Strike Mission",
  },
  {
    match: ["raid"],
    how: "Raids pedem grupo organizado. Use LFG ou comunidade. Se for novo, comece por Wing 1 com guia.",
    where: "Lion's Arch → asura gate / LFG Raids.",
    wpHints: ["Lion's Arch"],
    wiki: "Raid",
  },
  {
    match: ["pvp", "ranked", "unranked", "mists"],
    how: "Abra o painel PvP (H) e entre em Unranked ou Ranked. Gear Ascended de mapa não conta aqui.",
    where: "Heart of the Mists - portal PvP em qualquer cidade.",
    wpHints: ["Lion's Arch"],
    wiki: "Structured PvP",
  },
  {
    match: ["wvw", "world vs", "world versus"],
    how: "Entre em World vs. World pelo painel (B) ou portal. Siga o tag do seu servidor.",
    where: "Portal WvW / Eternal Battlegrounds.",
    wpHints: ["Lion's Arch"],
    wiki: "World versus World",
  },
  {
    match: ["adventure"],
    how: "Encontre o ícone de Adventure no mapa (bandeirinha). Faça o percurso no tempo bronze+.",
    where: "Mapa indicado no objetivo - busque o NPC/placa de Adventure.",
    wpHints: ["Lion's Arch"],
    wiki: "Adventure",
  },
  {
    match: ["jumping puzzle", "puzzle"],
    how: "Vá ao local do puzzle, complete sem morrer (ou use waypoints internos). Wiki ajuda com o caminho.",
    where: "Mapa do jumping puzzle - waypoint sugerido abaixo.",
    wpHints: ["Lion's Arch"],
    wiki: "Jumping Puzzle",
  },
  {
    match: ["gather", "forage", "mine", "log", "harvest"],
    how: "Equipe as ferramentas de gathering e colete nós no mapa aberto. Rotas densas em mapas 70-80.",
    where: "Mapas high-level ou home city outskirts.",
    wpHints: ["Lion's Arch"],
    wiki: "Gathering",
  },
  {
    match: ["craft", "forge", "refine"],
    how: "Use a estação de crafting da disciplina pedida. Lion's Arch tem todas juntas.",
    where: "Lion's Arch - crafting stations perto do centro.",
    wpHints: ["Lion's Arch"],
    wiki: "Crafting",
  },
  {
    match: ["dungeon"],
    how: "Entre pela entrada do dungeon (nível 80 recomendado). LFG (W) → Dungeons.",
    where: "Entrada do dungeon no mapa core.",
    wpHints: ["Lion's Arch"],
    wiki: "Dungeon",
  },
  {
    match: ["fish", "fishing"],
    how: "Equipe a vara, compre iscas no vendor de pesca e pesque no mapa pedido.",
    where: "Água do mapa do objetivo - vendor em Fishing Village / cidades.",
    wpHints: ["Lion's Arch", "Arborstone"],
    wiki: "Fishing",
  },
  {
    match: ["homestead", "decorat"],
    how: "Entre no Homestead pelo painel de housing e complete a tarefa de decoração.",
    where: "Seu Homestead (painel de conta / portal).",
    wpHints: ["Lion's Arch"],
    wiki: "Homestead",
  },
  {
    match: ["wizard", "vault", "astral"],
    how: "Abra o Wizard's Vault no painel (H) e reivindique/compre o que falta.",
    where: "Painel do jogo - Wizard's Vault.",
    wpHints: ["Lion's Arch"],
    wiki: "Wizard's Vault",
  },
];

export function resolveVaultObjective(title: string): {
  how: string;
  where: string;
  chatLink?: string;
  teleportLabel?: string;
  wikiUrl: string;
} {
  const t = title.toLowerCase();
  const hint =
    VAULT_HINTS.find((h) => h.match.some((m) => t.includes(m))) ?? null;
  const wikiUrl = wikiSearch(hint?.wiki ?? title);
  if (!hint) {
    const wp = findNearestWaypoint([title, "Lion's Arch"]);
    return {
      how: "Leia o objetivo no Vault e faça no modo indicado (PvE/PvP/WvW). Use Eventos se for meta/world boss.",
      where: "Siga o texto do objetivo; Lion's Arch é um bom hub para começar.",
      chatLink: wp?.waypoint.chatLink,
      teleportLabel: wp
        ? `${wp.waypoint.name} - ${wp.waypoint.mapName}`
        : undefined,
      wikiUrl,
    };
  }
  const wp = findNearestWaypoint([...hint.wpHints, title]);
  return {
    how: hint.how,
    where: hint.where,
    chatLink: wp?.waypoint.chatLink,
    teleportLabel: wp
      ? `${wp.waypoint.name} - ${wp.waypoint.mapName}`
      : undefined,
    wikiUrl,
  };
}
