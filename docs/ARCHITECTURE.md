# Arquitetura - GW2 Helper

## Princípios

1. **API-first:** fatos da conta vêm só de `api.guildwars2.com` + `GW2_API_KEY` do usuário final.
2. **Catálogo versionado do jogo:** dados estáticos (waypoints, setores, mapas, moedas, masteries, índice objetivo→WP) cacheados por `/v2/build`, atualizáveis sem mudar código.
3. **Helper acionável:** o quê / por quê / como / wiki / teleport (`chat_link`) quando existir.
4. **PvE ≠ PvP.**
5. **Dados fora do repo:** `%LOCALAPPDATA%\gw2_helper` ou `GW2_HELPER_DATA`.
6. **Personagem focado:** main (nível/idade) default; gear/Ascended seguem o foco. Achievements são da conta.
7. **Privacidade:** docs/agent nunca registram dados reais de conta. Ver [PRIVACY.md](PRIVACY.md).
8. **Copy/UI:** hífen ASCII `-` (nunca `U+2014` / `U+2013`). Nav sticky agrupada; tokens `panel` / `panel-glow` / `section-title`.

## Fluxo

```
Atualizar dados do jogo (público)
  → waypoints + setores + objective-waypoints + masteries.json
  → events-schedule.json (wiki Event timer, horários UTC agendados)
Atualizar minha conta (API key)
  → AccountSnapshot + defs achievements + recipes unlocked + prices TP
  → worldBosses feitos hoje + resolve nomes items/titles/skins/minis
  → recomendações PvE/PvP (inclui sessões multiobjetivo + mastery steps)
UI
  → /roadmap (orquestra tudo: sessão + eventos + vault + recs + ascended +
     masteries + achievements + story/map guides + craft + lendários + PvP)
  → /events timeline + sessões por mapId
  → /masteries (próximo nível + guia XP região)
  → /craft (estoque × receita × TP buy + farm do faltante)
```

## Persistência

| Path | Conteúdo |
|------|----------|
| `%LOCALAPPDATA%\gw2_helper\gw2.db` | snapshots index, recommendations, prefs |
| `...\snapshots\*.json` | dump da conta (local) |
| `...\catalog\waypoints.json` | WPs + chat_link |
| `...\catalog\sectors.json` | setores/áreas |
| `...\catalog\objective-waypoints.json` | texto de objetivo → WP mais próximo |
| `...\catalog\events-schedule.json` | world bosses/metas + pattern UTC (wiki) |
| `...\catalog\maps.json` / `currencies.json` / `masteries.json` / `meta.json` | resto do catálogo |

Roadmap da conta: `src/lib/roadmap/build.ts` (`buildAccountRoadmap`) + `story-guide` / `map-guide`.
Engine de eventos: `src/lib/events/` - `extractProgressGoals` → `scoreOccurrence` → `buildEventTimeline`.
Sessões multiobjetivo: `src/lib/sessions/map-session.ts` (cluster por `mapId`).
Masteries: `src/lib/masteries/` (rank + xp-guide; API sem barra de XP).
Crafting: `src/lib/craft/analyze.ts` + `recipesIndex` no sync; farm via `materials/guide.ts`.
Competitivo: `src/lib/recommend/pvp.ts` (sPvP + WvW) + `src/lib/wvw/` (rank titles no catálogo, match público por world).

Aliases WB/meta → setor/WP: `src/lib/catalog/event-aliases.ts`.

Wizard's Vault: `src/lib/vault/parse.ts` + `vault/guide.ts`.

Achievements: `rankAchievements` filtra expansão + Living World tocado.

v2: elites VoE, AR, festivais, lendários, prefs backup, LW por progresso, sync optional + `missingScopes`.

## Escala (expansões)

Novos mapas/itens/achievements entram via API no próximo sync/catalog refresh. Labels de expansão em `src/lib/gw2/access.ts` (PoF⇒HoT).

## LLM

Fora do escopo. Textos são templates + regras, preenchidos com dados da API.
