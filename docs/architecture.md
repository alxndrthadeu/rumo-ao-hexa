# Arquitetura — Documentação Técnica

## Visão geral

```
┌────────────────────────────────────────────────────────────┐
│  Cliente (Next.js / React)                                  │
│                                                            │
│  localStorage ◄──── RunState ────► API Route (stateless)  │
│  (estado ativo)                     (processa e devolve)   │
│                                                            │
│  page.tsx (useReducer) ◄── fetch ──► /api/run/[id]/action  │
└────────────────────────────────────────────────────────────┘
          │                                    │
          ▼                                    ▼
     Supabase DB                        engine/* (puro TS)
  (runs completas)                 (sem I/O, determinístico)
```

**Princípio fundamental**: o servidor é **stateless**. O `RunState` completo viaja em cada requisição — o cliente é a fonte de verdade durante o jogo. O banco é escrito apenas ao fim da run (game over ou vitória).

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript (strict) |
| UI | React + Tailwind CSS v4 (arbitrary values) |
| Gestos | `@use-gesture/react` v10 |
| Banco | Supabase (PostgreSQL) |
| Deploy | Vercel |
| Testes | Vitest |

---

## Estrutura de arquivos

```
rumoaohexa-app/
├── app/
│   ├── layout.tsx                 # RootLayout: fonts, viewport, body
│   ├── page.tsx                   # Home
│   ├── arquetipo/page.tsx         # Seleção de arquétipo
│   ├── jogar/[sessionId]/page.tsx # GamePage — shell principal do jogo
│   ├── historico/
│   │   ├── page.tsx               # Lista de runs
│   │   └── [sessionId]/page.tsx   # Detalhe de run
│   ├── legado/[sessionId]/page.tsx# Tela de legado pós-run
│   ├── como-jogar/page.tsx        # Tutorial
│   └── api/
│       ├── session/route.ts       # POST — cria sessão
│       ├── run/[sessionId]/
│       │   ├── route.ts           # GET — estado atual
│       │   └── action/route.ts    # POST — processa jogada ← rota principal
│       └── runs/
│           ├── route.ts           # GET — lista de runs do DB
│           └── complete/route.ts  # POST — persiste run finalizada
├── components/ui/
│   ├── Card.tsx                   # Carta arrastável (swipe)
│   ├── HUD.tsx                    # Header fixo com barras
│   ├── Bars.tsx                   # 4 mini-barras animadas
│   ├── LiveScoreboard.tsx         # Placar ao vivo (reagir/entrevista)
│   ├── TransitionScreen.tsx       # Telas de transição de fase
│   ├── GameOverScreen.tsx         # Tela de fim de run
│   ├── JornalScreen.tsx           # Jornal pós-partida ("Diário da Copa")
│   ├── GoalToast.tsx              # Toast de gol
│   ├── PhaseHeader.tsx            # Badge de fase no HUD
│   └── TokenPanel.tsx             # Painel de tokens de bônus
├── engine/                        # Lógica pura — sem I/O
│   ├── types.ts                   # Todos os tipos do domínio
│   ├── state.ts                   # createRunState, isGameOver
│   ├── phases.ts                  # applyCardChoice, resolveMatchEnd, resolvePenaltyEnd
│   ├── bars.ts                    # applyBarDelta, checkBarDeath, applyMatchDecay
│   ├── deck.ts                    # buildPreGameDeck, buildMatchDeck, getInterviewCard
│   ├── score.ts                   # checkMatchResult, matchPoints
│   ├── flags.ts                   # raiseFlag, applyCareerFlag, resolveInterviewFlag
│   ├── media.ts                   # applyMediaBias (viés de mídia por arquétipo)
│   ├── rng.ts                     # advanceSeed, seedToFloat
│   ├── jornal.ts                  # buildMatchRecord (manchete gerada)
│   ├── legacy.ts                  # buildLegacy (nota e epitáfio)
│   └── injection.ts               # injectClassCards, injectEvolucaoPair
├── data/
│   ├── config.json                # Parâmetros de balanceamento
│   ├── bracket.json               # Chaveamento das 7 partidas
│   └── cards/                     # JSONs de cartas por tipo e fase
│       ├── planejar/ancora.json
│       ├── planejar/circo.json
│       ├── reagir/generic.json
│       ├── reagir/classes/        # Um JSON por ClasseInimigo
│       ├── reagir/assinatura.json
│       ├── reagir/bonus.json
│       ├── reagir/especial_*.json
│       ├── entrevista.json
│       ├── crise.json
│       └── penaltis.json
└── lib/
    ├── history.ts                 # CRUD de runs no localStorage
    ├── api-types.ts               # Tipos das respostas de API
    ├── match-constants.ts         # REAGIR_MINUTO_LABEL, REAGIR_MINUTO_NUM
    └── supabase/                  # Clients server/client do Supabase
```

---

## Rota principal: `POST /api/run/[sessionId]/action`

**Arquivo:** `app/api/run/[sessionId]/action/route.ts`

### Request

```ts
{
  state: RunState,     // estado atual enviado pelo cliente
  cardId: string,      // ID da carta jogada
  escolha: 'esquerda' | 'direita'
}
```

### Fluxo de processamento

```
receber state + cardId + escolha
    │
    ├── validar carta (está em cartasRestantes?)
    │       └── se não: idempotência — retorna estado atual
    │
    ├── applyCardChoice(state, card, escolha)   ← engine/phases.ts
    │
    ├── remover cardId de cartasRestantes
    │
    ├── rastrear gols (se fase reagir + delta de placar)
    │
    └── if cartasRestantes.length === 0:
            ├── planejar  → buildMatchDeck → fase reagir
            ├── reagir    → checkMatchResult
            │       ├── penaltis → buildPenaltyDeck → fase penaltis
            │       └── outro   → getInterviewCard → fase entrevista
            ├── entrevista → resolveMatchEnd → fase planejar (próxima partida)
            │       └── buildPreGameDeck
            └── penaltis  → resolvePenaltyEnd → fase entrevista
```

### Response

```ts
{
  state: RunState,
  nextCards: Carta[] | CartaEntrevista[] | null,
  bracketEntry: BracketEntry,
  isGameOver: boolean
}
```

### Idempotência

Se o `cardId` não está em `cartasRestantes` mas existe no catálogo global, a rota assume retry de rede e retorna o estado atual sem re-processar. Isso evita double-processing em condições de rede instável.

---

## Estado no cliente — `useReducer` em `page.tsx`

### `GameState`

```ts
type GameState = {
  status: 'loading' | 'playing' | 'error'
  runState: RunState | null
  bracketEntry: BracketEntry | null
  currentCard: Carta | CartaEntrevista | null
  transition: TransitionType | null    // null = sem transição ativa
  lastResult: LastResult | null        // dados do resultado para TransitionScreen
  showJornal: boolean
  jornalRecord: MatchRecord | null
  showGameOver: boolean
  isSubmitting: boolean
  error: string | null
}
```

### Ações

| Ação | Dispara | Efeito |
|---|---|---|
| `LOADED` | mount do componente | Carrega estado do localStorage |
| `SUBMITTING` | inicio de `handleChoice` | `isSubmitting: true` |
| `RESULT_PREVIEW` | após resposta da API (transição iminente) | Atualiza barras/gols sem mudar fase; `currentCard: null` |
| `ACTION_DONE` | após delay do preview | Muda fase, `currentCard`, `transition` |
| `GAME_OVER` | `data.isGameOver === true` | `showGameOver: true` |
| `DISMISS_JORNAL` | toque em "Continuar" no Jornal | `transition: 'nova_partida'` |
| `DISMISS_TRANSITION` | auto-dismiss da TransitionScreen | `transition: null` |
| `ERROR` | falha de rede | `status: 'error'` |

### `RESULT_PREVIEW` — o que atualiza e o que não atualiza

```ts
case 'RESULT_PREVIEW':
  return {
    ...state,
    runState: {
      ...state.runState!,
      barras: action.runState.barras,           // ✅ anima visualmente
      tokens: action.runState.tokens,           // ✅ reflete ganhos
      golsBrasil: action.runState.golsBrasil,   // ✅ placar ao vivo atualiza
      golsAdversario: action.runState.golsAdversario,
      placarPartida: action.runState.placarPartida,
      // fase: NÃO atualiza — mantém a fase anterior para não mostrar
      //   LiveScoreboard antes do "Apita o Árbitro", nem Zona Mista antes
      //   de transitar para entrevista
    },
    currentCard: null,    // mostra spinner no lugar do card
  }
```

---

## Persistência

### Durante o jogo — `localStorage`

Gerenciado por `lib/history.ts`:

| Chave | Conteúdo |
|---|---|
| `rtt_active_run` | `{ sessionId, state, bracketEntry, currentCard }` |
| `rtt_completed_sessions` | Array de `sessionId` completos |
| `rtt_hint_seen` | `'1'` quando o tutorial de swipe já foi exibido |

`saveActiveRun` é chamado após cada `ACTION_DONE` bem-sucedido, antes de atualizar o estado React. Isso garante que a run pode ser retomada mesmo se o browser fechar.

### Fim de run — Supabase

`POST /api/runs/complete` persiste o `RunState` final no banco. Falhas são silenciadas — o localStorage serve de fallback para o legado.

---

## Geração de sessão

`POST /api/session` gera um `sessionId` (UUID) e uma `seed` inicial. A seed é derivada de `Date.now() ^ Math.random()` (ou similar) e determina toda a aleatoriedade da run.

---

## Dados de jogo (JSONs em `data/`)

Todos os dados de cartas são arquivos JSON importados estaticamente pelos módulos da engine. Não há leitura de banco ou filesystem em runtime.

### `data/config.json` — parâmetros de balanceamento

Centraliza todos os valores numéricos: limites de barra, soft cap, decaimento, thresholds de deck bonus, niggle multiplier, pontos de grupo. Qualquer ajuste de balanceamento é feito aqui, sem tocar no código.

### `data/bracket.json`

Array de 7 `BracketEntry`, um por partida:

```ts
interface BracketEntry {
  partida: number       // 1–7
  fase: string          // 'grupo' | 'oitavas' | 'quartas' | 'semi' | 'final'
  adversario: string    // nome do time
  classe: ClasseInimigo // estilo de jogo do adversário
  alvoVitoria: number   // unidades de placar por gol real
  empateValido: boolean // false em mata-mata
}
```

---

## Viewport e prevenção de scroll (iOS)

O `layout.tsx` define:

```tsx
export const viewport: Viewport = {
  themeColor: '#FFCB05',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',    // ocupa área segura em notch/home bar
}
```

O `globals.css` define:

```css
html, body { overscroll-behavior: none; }  /* sem rubber-band */
body { touch-action: pan-y; }              /* scroll vertical permitido fora do jogo */
```

A tela de jogo sobrescreve isso via `overflow-hidden` no shell e `touchAction: 'none'` no card, garantindo que durante o swipe o body não responda a gestos.

O `page.tsx` adiciona um `document.addEventListener('touchmove', handler, { passive: false })` que chama `preventDefault()` em gestos horizontais — última linha de defesa contra o Safari interpretar swipes como navegação back/forward.

---

## Fluxo completo de uma run

```
1. Home → /arquetipo → escolhe arquétipo
2. POST /api/session → { sessionId, seed }
3. POST /api/run/[id]/action com estado inicial → cartas do planejar (J1)
4. saveActiveRun(localStorage)
5. redirect → /jogar/[sessionId]

Loop de jogo:
  a. Usuário swipa/toca
  b. Card anima (260ms de fade)
  c. handleChoice() → dispatch(SUBMITTING)
  d. POST /api/run/[id]/action
  e. if (transição de fase):
       dispatch(RESULT_PREVIEW) → barras animam 700ms
  f. dispatch(ACTION_DONE) → próxima carta ou tela de transição
  g. saveActiveRun(localStorage)

Fim de run:
  h. isGameOver === true
  i. clearActiveRun()
  j. POST /api/runs/complete (persiste no Supabase)
  k. GameOverScreen → redirect /legado/[sessionId]
```

---

## Testes (`vitest`)

Os testes unitários cobrem a engine pura. Não há mocks de banco — a engine não tem I/O.

Arquivos de teste em `engine/__tests__/`:
- `bars.test.ts` — soft cap, niggle, decay, checkBarDeath
- `flags.test.ts` — raiseFlag, resolveInterviewFlag
- `score.test.ts` — checkMatchResult, matchPoints
- `rng.test.ts` — determinismo e distribuição da seed
- `media.test.ts` — applyMediaBias por arquétipo
- `legacy.test.ts` — buildLegacy
- `integration.test.ts` — fluxo completo de uma partida
