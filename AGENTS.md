<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` - verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# GW2 Helper - agent notes

- Projeto: helper local Guild Wars 2 (Next.js + SQLite fora do repo) para o **usuário final**.
- Regra: maximizar funções com foco na conta de API do usuário final; usar a API atual como exemplo para tudo.
- **Estado: v2 completa** - ver `docs/ROADMAP.md`.
- **Privacidade:** nunca gravar em docs/rules/skills/commits dados de conta real. Ver `docs/PRIVACY.md`.
- Skills: `.cursor/skills/gw2-helper/SKILL.md`
- Rules: `.cursor/rules/gw2-helper-*.mdc`
- Docs usuário: `README.md`, `docs/USER_GUIDE.md`, `docs/PRIVACY.md`, `docs/ARCHITECTURE.md`, `docs/API_CATALOG.md`, `docs/ROADMAP.md`

## Arquitetura

- Duas camadas: **DB do jogo** (WP/setores/objetivo→WP/schedule/festivais/masteries) ≠ **progresso da conta** (sync).
- Dados: `%LOCALAPPDATA%\gw2_helper` - nunca no working tree / git.
- Catálogo: refresh quando `/v2/build` muda; botão **Atualizar dados do jogo** (`force`) - WP, eventos, masteries, WvW ranks, story beats, maps. Wiki schedule precisa de `User-Agent`.
- **`/roadmap`** (`buildAccountRoadmap`): orquestra sessão + eventos + vault + recs + ascended + masteries + achievements + story/map + craft + lendários + PvP. API: `/api/roadmap`.
- Timeline `/events` + sessões multiobjetivo por `mapId`; festivais só na janela UTC; LW sem goal casado não entra.
- Masteries: rankear próximo nível × pontos livres; XP = guia por região (API não expõe barra).
- Crafting: recipes unlocked + estoque agregado + TP buy/sell + farm do que falta.
- Achievements = conta (LW só se `current>0`/bits); gear/Ascended/AR = personagem focado.
- Sync: equipment/buildtabs optional; `missingScopes` se a key for incompleta.
- Prefs: `/api/prefs/backup` (personagem + pins apenas).
- Competitivo: `/pvp` cobre **sPvP + WvW** (rank `wvw_rank`, matchup público, badges/tickets); catálogo inclui `wvw-ranks.json`.
- **Copy/UI:** hífen ASCII `-` apenas (proibido `U+2014` / `U+2013`). Nav sticky em grupos Plano / Progresso / Conta com wrap (sem scrollbar); classes `panel`, `panel-glow`, `section-title`.

## Validação antes de concluir

```
npm run sync
npm run catalog -- --force   # quando catálogo/schedule precisa refresh
npm run recs
npm run test:events
npm run build
npm run smoke                # requer npm run dev
npm run health
```

Sem colar PII em docs. Não criar commit sem pedido explícito do usuário. LLM enrichment fora do escopo.
