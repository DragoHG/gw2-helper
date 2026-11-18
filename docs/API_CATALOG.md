# Catálogo de APIs usadas

Base: `https://api.guildwars2.com/v2`

## Autenticadas (conta do usuário)

`account`, `tokeninfo`, `characters` (+ subrecursos; equipment/buildtabs **optional** se faltar scope), `account/bank`, `inventory`, `materials`, `wallet`, `achievements`, `masteries`, `mastery/points`, `legendaryarmory`, `recipes`, unlocks (skins/dyes/…), mounts, home, mapchests, worldbosses, dungeons, raids, wizardsvault/*, `account/skiffs`, `account/jadebots` (optional), `pvp/stats|standings|ranks`, `commerce/delivery`.

No sync, para achievements incompletos (até 250), o helper também busca:

- `/items` - rewards/bits Item (+ ícones)  
- `/titles` - rewards Title  
- `/skins` - bits Skin (+ ícones)  
- `/minis` - bits Minipet (+ ícones)  
- `/itemstats` - atributos do equipment focado  

Scopes recomendados: `account`, `characters`, `inventories`, `builds`, `progression`, `unlocks`, `wallet`, `pvp`, `tradingpost`. Ausentes viram `missingScopes` + rec acionável (sync **não** deve crashar por equipment).

## Estáticas (DB do jogo / build)

`build`, `currencies`, `maps`, `masteries` (tracks + níveis), `achievements` (ids + bits), `continents/1/floors/{1,2,3,49}` (waypoints + sectors).

No sync da conta também: `/recipes` (defs das unlocked), `/items` (outputs/ingredientes), `/commerce/prices` (chunks resilientes; itens não negociáveis são ignorados).

**Limite mastery XP:** a API **não** expõe a barra de XP atual da track - só níveis desbloqueados + pontos earned/spent. O guia de XP é por região (metas/mapas).

**Schedule de eventos (não é API ArenaNet):** wiki `Widget:Event_timer/data.json` → `events-schedule.json` + festivais UTC em `src/lib/catalog/festivals.ts`. Agendado ≠ live.

## Rotas locais do app

| Método | Path | Uso |
|--------|------|-----|
| POST | `/api/sync` | Conta + catálogo se build mudou + recomendações |
| GET/POST | `/api/catalog/refresh` | Meta / force reindex (`?force=1`) |
| GET | `/api/achievements` | Top achievements + teleports |
| GET | `/api/events?hours=8` | Timeline primary/bridges/upcoming |
| GET | `/api/roadmap` | Linha do tempo consolidada da conta |
| GET | `/api/recommendations` | PvE/PvP |
| GET | `/api/status` / `/api/snapshot` | Estado / dump local |
| POST | `/api/prefs/character` | Personagem focado |
| POST | `/api/prefs/pin-achievement` | Pin |
| GET/POST | `/api/prefs/backup` | Export/import prefs (personagem + pins; **sem** API key/snapshot) |

## Limites honestos

- API **não** lista waypoints desbloqueados; o `chat_link` ainda abre o mapa.
- Living World: sem flag de ownership - só sugerimos se já há progresso/bits no achievement (ou quest conhecida).
- Contadores sem local no mapa podem não ter teleport.
- AR estimada via infusions (não inclui AR base do gear Ascended).
- Sem API pública do gw2efficiency.
