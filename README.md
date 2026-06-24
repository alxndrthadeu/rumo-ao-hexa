# Rumo ao Hexa

Card game no estilo Reigns ambientado na Copa do Mundo 2026. Você encarna um atacante brasileiro e toma decisões deslizando cartas (esquerda/direita) em 7 partidas — da fase de grupos até a final.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Supabase** — sessões e persistência de estado
- **Vitest** — testes da engine
- **Tailwind CSS** — estilização
- Engine de jogo em TypeScript puro (`engine/`) — sem dependências externas, 100% imutável

## Como rodar

```bash
npm install
npm run dev
```

Abrir em `http://localhost:3000`.

## Estrutura

```
engine/       # Engine pura — state, fases, deck, balanço de barras, jornal
data/         # Cartas em JSON + config de balanço
app/          # Rotas Next.js (API + páginas)
components/   # Componentes de UI
```

## Conceitos principais

**Arquétipos** (3): `estrela`, `caido`, `futuro` — cada um tem barras iniciais diferentes e cartas exclusivas.

**Barras** (4): `torcida`, `midia`, `moral`, `fisico` — cada uma pode ir de 0 a 100. Atingir os extremos pela primeira vez aciona crise; pela segunda vez é morte.

**Fases por partida**: `planejar → reagir → entrevista`. Planejar tem 2-4 cartas de concentração; reagir tem 5 cartas de jogo; entrevista tem 1 carta pós-jogo determinada pelas flags acumuladas.

**Seed**: toda run tem uma seed (RNG LCG) que determina seleção de cartas, eventos de risco e manchetes do jornal — garantindo reprodutibilidade. O código de 8 hex chars é exibido no HUD para compartilhamento.

## Testes

```bash
npx vitest run
```

## Documentação de cartas

Ver `CARTAS.md` para referência completa de todos os tipos de cartas, formatos JSON, inventário e guia de criação.
