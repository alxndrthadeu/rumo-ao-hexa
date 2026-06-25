# Layout — Documentação Técnica

## Princípio central: App-shell fixo em `100dvh`

A tela de jogo (`app/jogar/[sessionId]/page.tsx`) é um **app-shell que não rola**. O `<body>` nunca faz scroll durante o jogo — esse é o invariante mais importante do layout.

```
┌─────────────────────────────────────┐  ← h-[100dvh] overflow-hidden
│  HUD  (altura fixa, bg-azul)        │
│  Faixa de fase  (3px)               │
│  LiveScoreboard (só em reagir/ent.) │
├─────────────────────────────────────┤
│  Banner contextual (planejar /      │
│  pênaltis) — altura fixa            │
├─────────────────────────────────────┤
│                                     │
│  Card  (flex-1 min-h-0)            │  ← encolhe até 0, nunca estoura
│  Hint swipe                         │
│  Botões de escolha                  │
└─────────────────────────────────────┘
```

### Por que `100dvh` e não `100vh`

No iOS/Safari, `100vh` inclui a área **atrás** da barra inferior do browser. Com `100dvh` (dynamic viewport height) a altura respeita a UI do Safari, garantindo que os botões de escolha fiquem sempre visíveis.

### Por que `min-h-0` em todos os filhos flex

Por padrão, um filho `flex` tem `min-height: auto`, o que impede o elemento de encolher abaixo do tamanho do seu conteúdo. Sem `min-h-0` o card cresce além do espaço disponível e estoura o container. Todos os níveis da hierarquia de flex que contêm o card carregam `min-h-0`.

```tsx
// page.tsx
<div className="flex flex-col h-[100dvh] overflow-hidden bg-papel">
  <div className="sticky top-0 z-40">          {/* HUD */}
  <div className="flex-1 flex flex-col pt-3 min-h-0 overflow-hidden">  {/* área do card */}

// Card.tsx
<div className="flex flex-col flex-1 min-h-0 select-none">
  <div className="flex-1 min-h-0 mx-[15px] flex flex-col justify-center ...">
```

---

## Telas de transição

Todas as telas autônomas (GameOver, TransitionScreen, JornalScreen, GameOverScreen) usam `h-[100dvh]` ou `fixed inset-0` — nunca `min-h-screen`.

| Componente | Estratégia de altura | Scroll interno |
|---|---|---|
| `TransitionScreen` | `h-[100dvh]` | Não |
| `GameOverScreen` | `fixed inset-0` | Não |
| `JornalScreen` | `fixed inset-0` + `overflow-y-auto` interno | Sim (jornal é longo) |

---

## Card — interação de swipe

**Arquivo:** `components/ui/Card.tsx`  
**Biblioteca:** `@use-gesture/react` v10

### Configuração do `useDrag`

```tsx
const bind = useDrag(handler, {
  axis: 'x',           // trava no eixo horizontal
  filterTaps: true,    // não confunde tap com drag
  preventScroll: true, // chama preventDefault no touch para não competir com scroll do body
})
```

```tsx
<div
  {...bind()}
  style={{
    touchAction: 'none',       // impede o iOS de tomar o gesto antes do use-gesture
    transformOrigin: '50% 120%', // pivô abaixo do card — efeito "balanço" tipo Reigns
    transform: `translateX(${tx}px) rotate(${rot}deg)`,
  }}
/>
```

### Valores de transform

| Variável | Fórmula | Propósito |
|---|---|---|
| `tx` | `dragX * 0.35` (ou ±360 ao confirmar) | Translação horizontal amortecida |
| `rot` | `dragX * 0.04` | Rotação suave conforme arrasto |
| `DRAG_THRESHOLD` | `80px` | Distância mínima para confirmar escolha |

### Feedback visual durante arrasto

- `dragX < -24` → `isDraggingLeft`: `inset-shadow` vermelho no card + `bg-vermelho/10` no botão esquerdo
- `dragX > 24` → `isDraggingRight`: `inset-shadow` verde no card + `bg-verde/10` no botão direito
- `transformOrigin: '50% 120%'`: o pivô abaixo do card cria o efeito de pêndulo ao girar

### Fallback de toque (botões no rodapé)

Abaixo do card ficam dois botões de largura plena com o texto de cada escolha e os badges de token (ChoiceFooter). São a via principal em dispositivos sem swipe preciso e a âncora de acessibilidade.

---

## HUD

**Arquivo:** `components/ui/HUD.tsx`

Fixo no topo (dentro do container `sticky top-0 z-40`). Contém:
- `PhaseHeader` — fase atual + adversário + número da partida
- Minuto do jogo (só em `reagir`, calculado via `REAGIR_MINUTO_LABEL`)
- Badge de tokens (abre `TokenPanel` ao clicar)
- Código da seed (últimos 8 hex da `initialSeed`)
- `Bars` — 4 mini-barras animadas

### Barras (animação)

As barras usam `transition-all duration-500` em CSS. Qualquer mudança em `runState.barras` anima automaticamente. Por isso o `RESULT_PREVIEW` (antes de mudar de tela) atualiza `barras` no estado para que o jogador veja a animação por ~700ms antes da transição.

---

## LiveScoreboard

**Arquivo:** `components/ui/LiveScoreboard.tsx`

Aparece apenas nas fases `reagir` e `entrevista`. Calcula o placar real dividindo `golsBrasil / alvoVitoria` e `golsAdversario / alvoVitoria` (inteiros).

Mapeamento de `cartasRestantes → minuto`:
```ts
const MINUTOS: Record<number, string> = { 5: "15'", 4: "45'", 3: "60'", 2: "88'", 1: "90+'" }
```

O ponto vermelho pulsante aparece enquanto `finalizado === false`.

---

## Fluxo de telas no `page.tsx`

O componente usa um único `useReducer` com as seguintes telas, em ordem de prioridade de renderização:

```
loading          → spinner
error            → mensagem + botão home
showGameOver     → GameOverScreen  (fixed overlay)
showJornal       → JornalScreen    (fixed overlay)
state.transition → TransitionScreen
default          → shell do jogo (HUD + Card)
```

### Sequência com `RESULT_PREVIEW`

Quando o usuário responde a última carta de uma fase que vai disparar uma transição (`match_start`, `entrevista_start`, `penaltis_start`):

1. API retorna o novo estado
2. `dispatch(RESULT_PREVIEW)` — atualiza **só** `barras`, `tokens`, `golsBrasil`, `golsAdversario`, `placarPartida`; **mantém** `runState.fase` original; `currentCard = null` (spinner no lugar do card)
3. `await 700ms` — janela para as barras animarem (500ms de CSS + 200ms de margem)
4. `dispatch(ACTION_DONE)` — atualiza fase, `currentCard` para a próxima carta, e define `transition`
5. `TransitionScreen` é renderizado

---

## Tokens de design (globals.css / tailwind theme)

```css
--color-amarelo: #FFCB05
--color-verde:   #009C3B
--color-azul:    #0A2A66
--color-vermelho:#E2231A
--color-preto:   #100F0D
--color-papel:   #F4F2EC
```

Fontes:
- `font-headline` → Saira (weights 400/700/900, normal + italic)
- `font-sans` → Inter
- `font-display` → Archivo Black

---

## Animações globais

### `animate-swipe-hint`

Animação CSS em `globals.css` que demonstra o gesto de swipe para novos jogadores. Dispara uma vez ao abrir a primeira run (controlado via `localStorage: rtt_hint_seen`).

```css
@keyframes swipe-hint {
  0%   { transform: translateX(0)   rotate(0deg);  }
  30%  { transform: translateX(-42px) rotate(-4deg); }
  50%  { transform: translateX(0)   rotate(0deg);  }
  70%  { transform: translateX(42px)  rotate(4deg);  }
  90%  { transform: translateX(0)   rotate(0deg);  }
  100% { transform: translateX(0)   rotate(0deg);  }
}
```

O `transformOrigin: '50% 120%'` do card é herdado pela animação CSS.

---

## Convenções de espaçamento

O projeto usa valores em `px` explícitos (via Tailwind arbitrary values) em vez de escala semântica. Padrão observado:
- Padding horizontal de telas: `px-[15px]` ou `px-[22px]`
- Gap entre elementos: `gap-[9px]`, `gap-[10px]`
- Texto de label pequeno: `text-[9px]` a `text-[11px]`, sempre `uppercase tracking-[0.2em]`
- `boxShadow` em botões primários: `'4px 4px 0 #100F0D'` (sombra sólida deslocada)
