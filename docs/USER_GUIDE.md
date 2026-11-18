# Guia do usuário final - GW2 Helper

Helper **local** no browser para Guild Wars 2 (**v2**). Você coloca **sua** API key, sincroniza a conta e vê o que fazer agora para ficar mais forte em PvE - adapta ao estágio (F2P → endgame/VoE), festivais ativos, Vault e Ascended. PvP fica separado.

## O que você precisa

- Conta Guild Wars 2
- API key em [account.arena.net/applications](https://account.arena.net/applications)  
  Escopos: `account`, `characters`, `inventories`, `builds`, `progression`, `unlocks`, `wallet`, `pvp`, `tradingpost`
- Node.js 20+ e npm

## Instalação rápida

1. Clone/copie o projeto
2. `copy .env.local.example .env.local` e cole **sua** key
3. `npm install`
4. `npm run dev`
5. Abra http://localhost:3000
6. Clique em **Atualizar minha conta**

Opcional: **Atualizar dados do jogo** - reindexa waypoints, setores, objetivos→teleport, schedule, masteries, ranks WvW, beats de história e mapas (não usa sua conta).

## Duas camadas (como o helper pensa)

| Camada | Botão | O que é |
|--------|--------|---------|
| **DB do jogo** | Atualizar dados do jogo | Waypoints, setores, objetivo→WP, schedule, masteries, ranks WvW, história, mapas. Independente da sua key. |
| **Sua conta** | Atualizar minha conta | Progresso, inventário, achievements, receitas, preços TP, WB feitos hoje, personagem focado. |

- A **lista do que falta** vem da API no momento atual.
- O **teleport sugerido** vem do índice do jogo (WP mais próximo do próximo passo).
- **Achievements** são da conta. **Gear / Ascended** seguem o personagem selecionado (main por padrão).

## Menu superior

Topo fixo ao rolar. Links em três grupos que quebram em linhas: **Plano**, **Progresso** e **Conta**. Sem barra de scroll horizontal.

## Telas

| Tela | Para quê |
|------|----------|
| **Sobre** | O que o helper faz, API key oficial, páginas, autor |
| **Linha do tempo** | Plano único da conta: agora, sessão, Vault, poder, mastery, achievements, história, mapas, craft, lendários, PvP |
| Fazer agora | Próximos passos ranqueados + top 5 achievements |
| Conta | Expansões reais (PoF inclui HoT), carteira, resumo |
| Personagens / Gear | Foco no personagem escolhido |
| Ascended | Rotas fáceis por slot (Laurel / craft / TP / Fractals) |
| Achievements | Top 5 detalhado, pin, teleport, wiki do passo |
| Eventos | Timeline + **sessões multiobjetivo** (vários goals no mesmo mapa) |
| Daily | Checklist do reset + resumo do Vault daily |
| Vault | Tracks daily/weekly/special + amostra da loja (Astral Acclaim) |
| Conta | Wallet, expansões + backup de preferências (personagem/pins) |
| Economia / Materiais | Carteira, delivery, mats com farm/WP |
| Crafting | O que pode craftar agora, o que falta, drop/farm e preço de compra no TP |
| Masteries | Tracks mais fáceis + guia de XP por região + WP |
| Legendaries | Visão de lendários (depois de Ascended) |
| PvP / WvW | sPvP (rank/winrate/builds) + WvW (rank, matchup ao vivo, badges/tickets, achievements) |

## Linha do tempo da conta (`/roadmap`)

Uma página só com o plano completo, adaptado ao estágio (F2P → VoE):

- **Ordem sugerida** - prioridade do que falta agora (evento ao vivo, Vault, Ascended, mastery fácil…)
- **Por faixa** - mesmas ações agrupadas (história, mapas, craft, PvP separado)
- Cada passo tenta trazer: **o quê / por quê / como / wiki / teleport**
- Living World só aparece se a conta **já tocou** o episódio

Use **Fazer agora** para o recorte curto do dia; use **Linha do tempo** quando quiser ver o caminho inteiro.

## Eventos (timeline)

A página **Eventos** mostra o próximo world boss/meta que **faz sentido para o seu progresso agora** (achievements faltando, daily de WB, mounts/masteries), com bridges até lá e timeline das próximas horas.

- Horários vêm do schedule público da wiki (UTC→seu relógio local). **Não é feed ao vivo do mapa** - pode atrasar ou falhar.
- A página **atualiza sozinha a cada segundo**; quando a janela do evento acaba, busca o **próximo** foco/na fila.
- Só eventos das expansões que sua conta tem.
- **Copiar waypoint** em cada card.
- O schedule atualiza com **Atualizar DB do jogo**.

## Teleport e wiki

1. Copie o código `[&…]`
2. Cole no chat do jogo e clique no link → abre o mapa
3. Se o waypoint estiver fechado, explore perto até liberar (a API **não** diz quais WPs você já abriu)
4. Use os links de wiki do achievement e do próximo passo se travar

## Expansões

A API às vezes manda a flag técnica `PlayForFree` mesmo em conta paga. O helper:

- Mostra o que você **realmente** tem (base + expansões)
- Trata **Path of Fire ⇒ Heart of Thorns** (conteúdo liberado no jogo)
- Lista expansões que você **não** tem, para não recomendar conteúdo bloqueado

## Dados na sua máquina

Tudo fica em `%LOCALAPPDATA%\gw2_helper` (Windows), **fora do git**:

- Snapshots da conta
- SQLite de recomendações/prefs
- Catálogo do jogo (waypoints, setores, objetivos)

Override: `GW2_HELPER_DATA` no `.env.local`.

Ver [PRIVACY.md](PRIVACY.md).

## Scripts úteis

| Comando | Uso |
|---------|-----|
| `npm run dev` | App no browser |
| `npm run sync` | Sync conta + catálogo se build mudou |
| `npm run catalog -- --force` | Reindexa DB do jogo (WP/setores/objetivos) |
| `npm run recs` | Recalcula recomendações do último snapshot |
| `node scripts/health-check.mjs` | Rotas HTTP ok |
| `node scripts/smoke-test.mjs` | Testes funcionais (sem vazar dados de conta) |
| `npm run test:events` | Engine de timeline (schedule + score) |
| `npm run build` | Build de produção |

## Preferências

Em **Conta** você pode baixar/importar um JSON com personagem focado e achievements fixados.  
O arquivo **não** contém API key nem snapshot da conta.

## Limites honestos

- Contadores sem local no mapa (ex.: “mate N inimigos”) podem não ter teleport.
- Story/map completion da API é incompleto.
- Não há API pública do gw2efficiency - só `api.guildwars2.com`.
- LLM **não** é source of truth neste helper.
