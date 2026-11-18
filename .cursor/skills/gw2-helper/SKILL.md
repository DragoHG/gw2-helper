---
name: gw2-helper
description: >-
  Desenvolver e manter o GW2 Helper local (sync API ArenaNet, catálogo por build
  com setores, índice objetivo→waypoint e schedule de eventos da wiki, timeline
  ao vivo de WB/metas ranqueada pelo progresso, recomendações PvE/PvP,
  achievements com teleport/wiki, Ascended, masteries, crafting/TP,
  sessões multiobjetivo, linha do tempo `/roadmap`, daily/vault/economy).
  Use ao sincronizar conta, atualizar mapas/eventos, eventos, waypoints,
  wiki, expansões, roadmap ou docs do usuário final.
---

# GW2 Helper Skill

## Regra verbatim do produto

maximizar funções com foco na conta de API do usuário final; usar a API atual como exemplo para tudo.

## Quando usar

- Sync / recomendações / gear Ascended / achievements / waypoints / eventos / roadmap / daily / vault / economy / legendaries / masteries / craft / PvP / WvW.
- Catálogo do jogo (`refreshCatalog`, setores, `objective-waypoints`, `events-schedule`, aliases em `event-aliases.ts`).
- Vault + festivais + lendários no motor; achievements filtrados (LW ≠ core cego); starters.
- Elites HoT/PoF/EoD/**VoE**; AR via infusions; prefs backup; ícones Skin/Mini.
- Estágio da conta (`stage.ts`) adapta home/recs a qualquer API key (F2P→endgame/VoE).
- Expansões (`access.ts` - PoF⇒HoT; SotO sem elite nova).
- Docs e rules focados no usuário final.

## Arquitetura em duas camadas

1. **DB do jogo** (público): waypoints, setores, índice objetivo→WP, schedule, masteries, WvW ranks, story beats. Botão **Atualizar dados do jogo** / `npm run catalog -- --force`.
2. **Conta** (API key): progresso no momento atual. Achievements = conta; gear = personagem focado. História no roadmap/home cruza beats do catálogo com expansões/estágio.

Teleport = (2) diz o que falta + (1) aponta o WP. Timeline `/events` cruza schedule agendado (não live do mapa) com goals; UI com relógio ao vivo.

## Fluxo obrigatório

1. Features genéricas para o usuário final; testar com key local **sem** documentar PII.
2. Se `/v2/build` mudou (ou falta `objectiveCount`/`sectorCount`/`eventCount`), refresh do catálogo.
3. Feature API-first + copy iniciante + wiki + teleport quando o objetivo tiver local.
4. Resolver nomes (`/items`, `/titles`, `/skins`, `/minis`) - nunca deixar `item #123` na UI se a API tiver nome.
5. Personagem selecionado (main default) para poder/Ascended.
6. Sync resiliente: equipment/buildtabs optional; LW tocada por progresso; beat LW4 pós-PoF; festivais só na janela.
7. `/roadmap` + `/story` usam `story-guide` (PoF→LW4, bloqueados visíveis) - não duplicar fora de `src/lib/roadmap/`.
8. Validar: `npm run sync` + `test:events` + `smoke` + `health` + `build`. Sem colar output sensível em docs.

## Copy e UI

- Hífen ASCII `-` em textos (UI, docs, comments). Proibido em-dash `U+2014` e en-dash `U+2013`.
- Nav sticky agrupada: Plano / Progresso / Conta. Preferir `panel`, `panel-glow`, `section-title`, `neon-link`.
- Paleta slate/cyan (evitar `stone-*` legado).

## Não fazer

- Documentar ou versionar API keys, nomes de conta, personagens, inventário ou progresso real.
- Gravar DB/snapshots dentro do diretório do repo.
- Assumir waypoints desbloqueados (API não expõe).
- Commit sem pedido explícito do usuário.
- Tipografia artificial (travessões tipográficos).
