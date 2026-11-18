# GW2 Helper

Helper **local** no browser para Guild Wars 2 (**v2**): cada usuário coloca **a própria** API key, sincroniza a conta e vê o que fazer agora (PvE e PvP). Adapta-se ao estágio (F2P → endgame/VoE), com personagem selecionável - pensado também para iniciantes.

## Setup

1. `copy .env.local.example .env.local`
2. Cole **sua** API key ([ArenaNet Applications](https://account.arena.net/applications)) com scopes: `account`, `characters`, `inventories`, `builds`, `progression`, `unlocks`, `wallet`, `pvp`, `tradingpost`
3. `npm install` → `npm run dev` → http://localhost:3000
4. **Atualizar minha conta**
5. **Atualizar dados do jogo** (recomendado na 1ª vez) - waypoints, eventos, masteries, ranks WvW, história, mapas
6. (Opcional) Validar: `npm run smoke` com o `dev` rodando

Guia completo: [docs/USER_GUIDE.md](docs/USER_GUIDE.md)

## O que o app oferece

- **Linha do tempo** (`/roadmap`) - plano único da conta (agora → poder → mastery → história → craft → PvP)
- **Fazer agora** - passos ranqueados + sessão multiobjetivo + mastery fácil
- **Personagem selecionável** - main por padrão (gear/Ascended/craft)
- **Achievements** - top fáceis, pin, teleport, wiki, ícones
- **Eventos** - timeline + sessões (vários goals no mesmo mapa)
- **Masteries** - próximo nível mais fácil + guia de XP por região + WP
- **Crafting** - o que pode craftar, o que falta, drop/farm e preço TP
- **Vault / Daily / Fractals (AR) / Ascended / Economia / Legendaries**
- **Prefs** - backup/restore de personagem focado + pins (Conta)
- **PvP / WvW** - sPvP equalizado + World vs World (rank, matchup, badges)

## Dados locais

Conta e catálogo ficam em `%LOCALAPPDATA%\gw2_helper` (Windows), **fora do git**.  
Override: `GW2_HELPER_DATA` no `.env.local`. Ver [docs/PRIVACY.md](docs/PRIVACY.md).

Nunca commite `.env.local`, snapshots ou o SQLite.

## Scripts

| Comando | Uso |
|---------|-----|
| `npm run dev` | Dashboard |
| `npm run build` | Build de produção |
| `npm run sync` | Sync da conta + catálogo se build mudou |
| `npm run catalog -- --force` | Reindexa DB do jogo |
| `npm run recs` | Recalcula recomendações |
| `npm run smoke` | Smoke das rotas e fluxos |
| `npm run test:events` | Timeline + estágio + prefs + LW |
| `npm run health` | Rotas HTTP |

## Docs

- [Guia](docs/USER_GUIDE.md)
- [Privacidade](docs/PRIVACY.md)
- [Arquitetura](docs/ARCHITECTURE.md)
- [APIs](docs/API_CATALOG.md)
- [Roadmap](docs/ROADMAP.md)
