# Roadmap

## Estado atual: v2 COMPLETA

Critério de pronto (usuário final, qualquer API key / estágio):

- Next-actions úteis de F2P → endgame/VoE com o quê / por quê / como / wiki / teleport
- **`/roadmap`** - linha do tempo consolidada (sessão, eventos, Vault, poder, mastery, achievements, story/mapas, craft, lendários, PvP/WvW)
- **PvP / WvW** - sPvP + World vs World (rank, matchup ao vivo, badges/tickets, achievements)
- Masteries + craft/TP + sessões multiobjetivo no motor e na UI
- Sync resiliente a scopes parciais; `missingScopes` explícito
- LW só se já tocado; festivais só na janela UTC
- Sem PII em docs/git
- Gate: `sync` / `catalog --force` / `recs` / `test:events` / `build` / `smoke` / `health`

### v1 (base)

Sync + catálogo por build, timeline, Ascended, achievements + teleport, Vault UI, estágio, PvE≠PvP.

### v2 (poder + honestidade)

- Elites VoE (73-81); SotO = Weaponmaster (sem elite nova)
- Skiffs / jadebots / itemstats / ícones Skin/Mini
- AR via infusions; auditoria atributos support vs power
- LW ownership por progresso real; festivais data-driven
- Planner lendários; prefs backup; aliases EoD/SotO/JW/VoE/LW
- Equipment/buildtabs optional no sync (não crashar sem `builds`/`inventories`)

## v3 (opcional)

- Homestead / housing deep
- Builds meta oficiais versionadas (sem scrape)
- Festivais com horários exatos por ano (wiki overlay)
- Planner lendário com árvore de gifts/precursors
- AR completa (base gear + infusions + inventário)

## Fora (por decisão)

- LLM/RAG como source of truth
- Overlay in-game
- Scrape gw2efficiency
- Documentar dados reais de contas em docs/git
