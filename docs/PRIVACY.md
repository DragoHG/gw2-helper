# Privacidade e dados do usuário

## Regra

Nunca documentar, commitar ou versionar dados de conta real (nome da conta, personagens, gold, API key, snapshots, progresso).

Docs, rules e skills descrevem só o **produto** e o fluxo para o **usuário final**.

## O que fica local (não vai para o git)

- `.env.local` com `GW2_API_KEY`
- Snapshots e SQLite em `%LOCALAPPDATA%\gw2_helper` (ou `GW2_HELPER_DATA`)
- Catálogo do jogo (waypoints/setores/índice) - público da API, mas cache local
- Preferências (personagem selecionado, achievements fixados)

## O que o usuário final faz

1. Cria a própria API key na ArenaNet  
2. Coloca no `.env.local`  
3. Sincroniza no app - o helper mostra **a conta dele**  
4. Opcionalmente atualiza o DB do jogo (dados públicos, sem a key de conta)

## O que agentes/docs podem dizer

- Escopos necessários da key  
- Como sincronizar e onde os dados ficam  
- Exemplos **genéricos** (ex.: “personagem nível 80”, “Laurels para trinkets Ascended”)  
- Contagens/resultados de smoke sem nomes reais

## O que agentes/docs NÃO podem dizer

- Nome de conta, personagens, inventário ou estatísticas de um usuário específico  
- Conteúdo de snapshots ou API keys  
- Colar output de sync com PII em commits/docs
