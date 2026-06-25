# Engine — Documentação Técnica

A engine é **TypeScript puro sem side-effects** — todas as funções são puras e o estado é imutável. O servidor de API recebe o `RunState` atual, processa a jogada e retorna o novo `RunState`. Não há banco de dados envolvido no loop de jogo.

---

## Tipos fundamentais (`engine/types.ts`)

### `RunState`

O estado completo de uma run. É serializado para o localStorage do cliente e enviado em cada requisição de API.

```ts
interface RunState {
  // Identidade
  arquetipo: Arquetipo           // 'estrela' | 'caido' | 'futuro'
  nomeJogador: string
  camisa: number

  // Progresso
  partidaAtual: number           // 1–7
  fase: Fase                     // 'planejar' | 'reagir' | 'entrevista' | 'penaltis'
  cartasRestantes: string[]      // IDs das cartas ainda não jogadas na fase atual

  // Barras (0–100)
  barras: { torcida; midia; moral; fisico }

  // Placar da partida em andamento
  placarPartida: number          // unidades brutas (alvo de vitória varia por partida)
  golsBrasil: number             // acumulador bruto de gols marcados
  golsAdversario: number         // acumulador bruto de gols sofridos

  // Contexto
  pontosGrupo: number            // apenas fase de grupos (J1–J3)
  flagsPartida: string[]         // flags temporárias — resetadas ao fim da entrevista
  flagsCarreira: Record<string, number>  // flags permanentes da run
  niggles: string[]              // modificadores negativos persistentes
  tokens: Record<string, number> // moeda de bônus (concede/gasta via cartas)
  crise?: CriseState             // barra em estado crítico (segunda chance antes de morrer)
  cartasVistas: string[]         // histórico para evitar repetição de âncora/circo

  // Fim de run
  morto: boolean
  causaMorte?: CausaMorte        // 'placar' | 'barra' | 'vitoria' | 'expulsao' | 'penaltis'
  barraMorte?: { barra; extreme }

  // RNG
  seed: number                   // semente atual (avança a cada decisão aleatória)
  initialSeed: number            // semente original (imutável — usada para replay/sharing)

  // Histórico
  historicoPartidas: MatchRecord[]
}
```

### `Carta` — estrutura de uma carta jogável

```ts
interface Carta {
  id: string
  fase: Fase
  partida: number        // em qual partida esta carta pode aparecer (0 = qualquer)
  texto: string
  esquerda: Escolha
  direita: Escolha
  naipe?: 'ancora' | 'circo'
  camada?: Camada        // 'generica' | 'classe' | 'assinatura' | 'bonus' | 'especial' | 'crise'
  requer_classe?: ClasseInimigo   // só aparece contra esta classe de adversário
  requer_passiva?: Arquetipo      // só aparece para este arquétipo
  posicao?: 'inicio' | 'fim'     // slot fixo no deck de reagir
}
```

### `Escolha` — efeitos de uma opção

```ts
interface Escolha {
  texto: string
  efeitos: Efeitos         // { torcida?; midia?; moral?; fisico?; placar? }
  flags_partida?: string[]
  flag_carreira?: string
  concede_token?: string   // nome do token concedido
  risco?: Risco            // efeito probabilístico (incluindo cartão vermelho)
  niggle?: string          // modificador negativo adicionado ao estado
  condicional?: { limiar; ramoA; ramoB }  // só quando efeitos.placar === 'condicional'
}
```

---

## Fases e transições (`engine/phases.ts`)

### Máquina de estados

```
planejar ──► reagir ──► entrevista ──► planejar (próxima partida)
                │             ▲
                └──► penaltis ─┘
```

- **planejar**: 2–4 cartas de concentração (âncora + circo + opcionais). Última carta dispara `buildMatchDeck` e transita para `reagir`.
- **reagir**: 5 cartas de 90 minutos. Última carta resolve o placar e transita para `entrevista` (ou `penaltis` se empate em mata-mata).
- **entrevista**: 1 carta selecionada por `getInterviewCard` baseada em flags. Ao responder, `resolveMatchEnd` é chamado.
- **penaltis**: 3 cartas interativas. Ao esgotar, `resolvePenaltyEnd` resolve matematicamente o placar da disputa.

### `applyCardChoice` — aplicação de uma jogada

Ordem de resolução:

1. **Efeitos de barras + placar** — `applyEfeitos()`: aplica deltas, resolve `condicional` usando `placarPartida + bonusCrescimento` (só `futuro`)
2. **Flags de partida** — `applyFlags()`: levanta flags usadas pela entrevista
3. **Flag de carreira** — `applyCareerFlag()`: flags permanentes da run
4. **Niggle** — `applyNiggle()`: adiciona modificador negativo persistente
5. **Risco** — `applyRisco()`: rola o dado e aplica efeito probabilístico; token consome o risco
6. **Morte de barra** — `checkBarDeath()`: se morreu pela primeira vez → crise; se já estava em crise → morte real
7. **Token** — `grantToken()`: concede token após todos os efeitos (não concede se morreu)

Para cartas de **entrevista**, a lógica é separada em `applyInterviewChoice` que aplica viés de mídia via `applyMediaBias` antes de processar os efeitos.

---

## Barras (`engine/bars.ts`)

### Limites

Configurados em `data/config.json`:
- `deathMin`: barra abaixo deste valor → morte (ou crise)
- `deathMax`: barra acima deste valor → morte (ou crise), **exceto** `moral` (configurado em `deathAtMaxExclude`)

### Modificadores

**A — Soft cap** (`applySoftCap`): ganhos positivos são reduzidos quando a barra está alta. Impede acumulação descontrolada acima de `softCap.threshold1` e `threshold2` sem alterar nenhuma carta.

**B — Niggle `divida_lesao`** (`applyNiggleModifier`): aumenta o custo de efeitos negativos em `fisico` por `config.niggle.costMultiplier`. Ativo por padrão no arquétipo `caido`.

**C — Decaimento de partida** (`applyMatchDecay`): ao avançar de partida, barras acima de `config.decay.threshold` perdem `config.decay.amount` pontos. Simula desgaste físico e mental acumulado.

### Sistema de crise

Quando `checkBarDeath` detecta um limite pela **primeira vez**:
- A barra é travada em `5` (mín) ou `95` (máx) — nunca passa do threshold
- `state.crise` é setado com a barra e o extreme
- Uma carta de crise (`crise_<barra>`) é injetada na frente do deck de planejar

Se a barra chega ao limite **novamente** enquanto `state.crise` está ativo → morte real.

Sobreviver a uma carta de crise limpa `state.crise` e incrementa `flagsCarreira.sobreviveu_crise`.

---

## Deck building (`engine/deck.ts`)

### Planejar — `buildPreGameDeck`

Monta 2–4 cartas:

| Slot | Conteúdo | Regra |
|---|---|---|
| 0 (ou frente) | Carta de crise | Só se `state.crise` ativo |
| base[0] | Âncora | Aleatória do pool; exclui já vistas na run |
| base[1] | Circo | Assinatura da partida (se existir) ou aleatório |
| +1 (opcional) | Passiva do arquétipo | Só se existir para esta `partida` |
| +1 (opcional) | Carta de imprensa | Se `midia >= midiaHighThreshold` ou `<= midiaLowThreshold` |

Âncoras e circos vistos são registrados em `cartasVistas` para não se repetirem ao longo das 7 partidas. Cartas assinatura e passiva não entram nessa lista (são fixas por design).

### Reagir — `buildMatchDeck`

Monta exatamente 5 cartas:

| Slot | Conteúdo | Regra |
|---|---|---|
| 0 | Bônus de moral ou genérica | `moral >= highThreshold` → `bonus_moral_alto`; `<= lowThreshold` → `crise_moral` |
| 1–2 | Genéricas embaralhadas | Fisher-Yates seeded |
| 3 | Bônus de físico ou genérica | Análogo ao slot 0 |
| 4 | Especial de torcida | `torcida` alta/baixa/neutra seleciona pool diferente |

Além disso:
- **Classe do adversário**: `injectClassCards` substitui 1–2 genéricas por cartas específicas da classe (`tecnico`, `fisico`, `favorito`, `rival_historico`, `evolucao`, `saco_pancada`)
- **Assinatura**: carta com `posicao: 'inicio'` vai ao slot 0; `posicao: 'fim'` vai ao slot 3 (sobrepõe bônus de moral/físico)
- **Passiva do arquétipo**: injetada por `injectPassiveCards`

### Entrevista — `getInterviewCard`

A flag é resolvida por `resolveInterviewFlag(state)` que analisa `flagsPartida` em ordem de prioridade. Retorna o ID de uma `CartaEntrevista` com `requer_flag` correspondente, ou a carta `fallback`.

---

## RNG — `engine/rng.ts`

O gerador é **determinístico por seed**. A seed avança via `advanceSeed(seed)` (linear congruential ou similar) e converte para float via `seedToFloat`. Isso garante que runs com a mesma `initialSeed` produzam exatamente os mesmos resultados — base do sistema de replay/compartilhamento.

---

## Placar e resultado (`engine/score.ts`)

### Gols

O `placarPartida` é um contador bruto de unidades. `alvoVitoria` (por partida, em `bracket.json`) define quantas unidades valem 1 gol real. Ao exibir:

```ts
realGolsBra = Math.floor(golsBrasil / alvoVitoria)
realGolsAdv = Math.floor(golsAdversario / alvoVitoria)
```

### Resultado da partida

```ts
function checkMatchResult(golsBra, golsAdv, partida): ResultadoPartida {
  if (golsBra > golsAdv)  return 'vitoria'
  if (partida >= 4 && golsBra === golsAdv) return 'penaltis'  // mata-mata
  if (partida >= 4)       return 'derrota'
  return golsBra >= golsAdv ? 'empate' : 'derrota'            // grupos
}
```

### Pontos de grupos

- Vitória: `config.group.win` pts
- Empate: `config.group.draw` pts
- Derrota: `config.group.loss` pts
- Classificação: `>= config.group.classifyMin` pts após J3

---

## Pênaltis (`resolvePenaltyEnd`)

Após as 3 cartas interativas, a resolução é matemática:

1. **Sua cobrança**: `placarPartida > 0 ? 1 : 0`
2. **4 companheiros**: `P = 68% + (moral/100) * 10%` cada
3. **5 adversários**: `P = 68%` fixo
4. **Morte súbita** se empatou após 5 cobranças cada

A vitória incrementa `flagsCarreira` implicitamente e dispara a fase de `entrevista` com flag `penaltis`.

---

## Tokens

Tokens são moedas de bônus nomeadas (`ousado`, `disciplinado`, `raca`, `frieza`, `lider`). São concedidos por `Escolha.concede_token` e gastos por `Risco.requer_token`.

Quando um risco `requer_token` é processado:
- Se o token existe (`tokens[nome] > 0`): consome 1 e **garante sucesso** (o risco não dispara)
- Se não existe: rola o dado normalmente

---

## Viés de mídia (`engine/media.ts`)

Cartas de entrevista com efeito em `midia` passam por `applyMediaBias` antes de aplicar o delta. O viés depende de:
- `carga` da carta: `'ELOGIO' | 'CRITICA' | 'NEUTRA'`
- `arquetipo` do jogador
- Nível atual de `barras.midia`

A lógica implementa a assimetria narrativa: a estrela recebe mais pressão em crise, o `futuro` recebe mais impulso em elogios.

---

## `resolveMatchEnd` — resumo

Chamado após a última carta de `entrevista`:

1. Registra `MatchRecord` no histórico via `buildMatchRecord`
2. Verifica vitória final (partida 7 + vitória → `causaMorte: 'vitoria'`)
3. Pênaltis → delegado para fase `penaltis` (não chega aqui se veio de pênaltis)
4. Mata-mata com derrota → `causaMorte: 'placar'`
5. Grupos: acumula pontos; J3 com `< 5pts` → eliminação
6. Avança para próxima partida: reseta flags, placar, gols; aplica `applyMatchDecay`
7. Bônus de crescimento do `futuro`: +1 por vitória, máx 3
