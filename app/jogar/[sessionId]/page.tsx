'use client'

import { useCallback, useEffect, useReducer, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import type { BracketEntry, Carta, CartaEntrevista, Efeitos, MatchRecord, RunState } from '@/engine/types'
import type { ActionResponse } from '@/lib/api-types'
import { loadActiveRun, clearActiveRun, saveActiveRun, saveCompletedSession } from '@/lib/history'
import HUD from '@/components/ui/HUD'
import Card from '@/components/ui/Card'
import TransitionScreen, { type TransitionType } from '@/components/ui/TransitionScreen'
import GoalToast, { type GoalEvent } from '@/components/ui/GoalToast'
import GameOverScreen from '@/components/ui/GameOverScreen'
import JornalScreen from '@/components/ui/JornalScreen'
import LiveScoreboard from '@/components/ui/LiveScoreboard'
import { REAGIR_MINUTO_NUM } from '@/lib/match-constants'

// ─── State ───────────────────────────────────────────────────────────────────

type GameStatus = 'loading' | 'playing' | 'error'

type LastResult = { adversario: string; placarDelta: number; golsBrasil?: number; golsAdversario?: number; viaPenaltis?: boolean }

type GameState = {
  status: GameStatus
  runState: RunState | null
  bracketEntry: BracketEntry | null
  currentCard: Carta | CartaEntrevista | null
  transition: TransitionType | null
  lastResult: LastResult | null
  showJornal: boolean
  jornalRecord: MatchRecord | null
  showGameOver: boolean
  isSubmitting: boolean
  error: string | null
}

const initial: GameState = {
  status: 'loading',
  runState: null,
  bracketEntry: null,
  currentCard: null,
  transition: null,
  lastResult: null,
  showJornal: false,
  jornalRecord: null,
  showGameOver: false,
  isSubmitting: false,
  error: null,
}

type GameAction =
  | { type: 'LOADED'; runState: RunState; bracketEntry: BracketEntry; card: Carta | CartaEntrevista }
  | { type: 'SUBMITTING' }
  | { type: 'RESULT_PREVIEW'; runState: RunState }
  | { type: 'ACTION_DONE'; prevFase: string; prevPartida: number; prevPlacar: number; prevBracketEntry: BracketEntry; runState: RunState; bracketEntry: BracketEntry; nextCard: Carta | CartaEntrevista }
  | { type: 'GAME_OVER'; runState: RunState }
  | { type: 'DISMISS_JORNAL' }
  | { type: 'DISMISS_TRANSITION' }
  | { type: 'ERROR'; message: string }

function detectTransition(
  prevFase: string,
  prevPartida: number,
  newFase: string,
  newPartida: number
): TransitionType | null {
  if (prevFase === 'planejar'   && newFase === 'reagir')      return 'match_start'
  if (prevFase === 'reagir'     && newFase === 'entrevista')  return 'entrevista_start'
  if (prevFase === 'reagir'     && newFase === 'penaltis')    return 'penaltis_start'
  if (prevFase === 'penaltis'   && newFase === 'entrevista')  return 'entrevista_start'
  if (prevFase === 'entrevista' && newFase === 'planejar' && newPartida !== prevPartida) return 'nova_partida'
  return null
}

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'LOADED':
      return {
        ...state,
        status: 'playing',
        runState: action.runState,
        bracketEntry: action.bracketEntry,
        currentCard: action.card,
        transition: null,
        lastResult: null,
        showJornal: false,
        jornalRecord: null,
        showGameOver: false,
        isSubmitting: false,
        error: null,
      }
    case 'SUBMITTING':
      return { ...state, isSubmitting: true, error: null }
    case 'RESULT_PREVIEW':
      return {
        ...state,
        runState: {
          ...state.runState!,
          barras: action.runState.barras,
          tokens: action.runState.tokens,
          golsBrasil: action.runState.golsBrasil,
          golsAdversario: action.runState.golsAdversario,
          placarPartida: action.runState.placarPartida,
        },
        currentCard: null,
      }
    case 'ACTION_DONE': {
      const transition = detectTransition(
        action.prevFase,
        action.prevPartida,
        action.runState.fase,
        action.runState.partidaAtual
      )

      // lastResult: depende da transição de fase
      const lastResult: LastResult | null =
        action.prevFase === 'entrevista' && action.runState.fase === 'planejar'
          ? (() => {
              const hist = action.runState.historicoPartidas
              const lastRecord = hist[hist.length - 1]
              return { adversario: action.prevBracketEntry.adversario, placarDelta: action.prevPlacar, viaPenaltis: lastRecord?.resultado === 'penaltis' }
            })()
        : action.prevFase === 'reagir' && action.runState.fase === 'entrevista'
          ? { adversario: action.prevBracketEntry.adversario, placarDelta: action.runState.placarPartida, golsBrasil: action.runState.golsBrasil, golsAdversario: action.runState.golsAdversario }
        : action.prevFase === 'penaltis' && action.runState.fase === 'entrevista'
          ? { adversario: action.prevBracketEntry.adversario, placarDelta: 0, viaPenaltis: true }
        : state.lastResult

      // JornalScreen aparece ANTES da transição nova_partida
      if (transition === 'nova_partida') {
        const historia = action.runState.historicoPartidas
        const jornalRecord = historia[historia.length - 1] ?? null
        return {
          ...state,
          runState: action.runState,
          bracketEntry: action.bracketEntry,
          currentCard: action.nextCard,
          transition: null,
          lastResult,
          showJornal: true,
          jornalRecord,
          isSubmitting: false,
        }
      }

      return {
        ...state,
        runState: action.runState,
        bracketEntry: action.bracketEntry,
        currentCard: action.nextCard,
        transition,
        lastResult,
        isSubmitting: false,
      }
    }
    case 'GAME_OVER':
      return { ...state, runState: action.runState, showGameOver: true, isSubmitting: false }
    case 'DISMISS_JORNAL':
      return { ...state, showJornal: false, jornalRecord: null, transition: 'nova_partida' }
    case 'DISMISS_TRANSITION':
      return { ...state, transition: null, lastResult: null }
    case 'ERROR':
      return { ...state, status: 'error', isSubmitting: false, error: action.message }
    default:
      return state
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function GamePage() {
  const router = useRouter()
  const params = useParams<{ sessionId: string }>()
  const sessionId = params.sessionId

  const [state, dispatch] = useReducer(reducer, initial)
  const [goalEvent, setGoalEvent] = useState<GoalEvent | null>(null)
  const [previewEfeitos, setPreviewEfeitos] = useState<Efeitos | null>(null)
  const [showSwipeHint, setShowSwipeHint] = useState(false)

  useEffect(() => {
    try {
      const active = loadActiveRun()
      if (!active) throw new Error('Sessão não encontrada')
      if (active.sessionId !== sessionId) throw new Error('Sessão incorreta')
      dispatch({ type: 'LOADED', runState: active.state, bracketEntry: active.bracketEntry, card: active.currentCard })

      // Mostra hint de swipe apenas na primeira vez que o jogador abre uma run
      if (!localStorage.getItem('rtt_hint_seen')) {
        setShowSwipeHint(true)
        localStorage.setItem('rtt_hint_seen', '1')
      }
    } catch (e) {
      dispatch({ type: 'ERROR', message: e instanceof Error ? e.message : 'Sessão não encontrada' })
    }
  }, [sessionId])

  // Previne o Safari de interpretar swipe horizontal como navegação back/forward
  useEffect(() => {
    let startX = 0
    let startY = 0
    let isHorizontal: boolean | null = null

    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      isHorizontal = null
    }

    const onMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      const dx = e.touches[0].clientX - startX
      const dy = e.touches[0].clientY - startY
      if (isHorizontal === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isHorizontal = Math.abs(dx) > Math.abs(dy)
      }
      if (isHorizontal) e.preventDefault()
    }

    document.addEventListener('touchstart', onStart, { passive: true })
    document.addEventListener('touchmove', onMove, { passive: false })
    return () => {
      document.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchmove', onMove)
    }
  }, [])

  async function handleChoice(lado: 'esquerda' | 'direita') {
    if (!state.currentCard || state.isSubmitting || !state.runState) return

    const prevFase           = state.runState.fase
    const prevPartida        = state.runState.partidaAtual
    const prevPlacar         = state.runState.placarPartida
    const prevCartasLen      = state.runState.cartasRestantes.length
    const prevBracketEntry   = state.bracketEntry!
    const prevGolsBrasil     = state.runState.golsBrasil
    const prevGolsAdversario = state.runState.golsAdversario

    dispatch({ type: 'SUBMITTING' })

    try {
      const res = await fetch(`/api/run/${sessionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: state.runState, cardId: state.currentCard.id, escolha: lado }),
      })

      if (!res.ok) throw new Error('Erro ao enviar escolha')

      const data: ActionResponse = await res.json()

      if (data.isGameOver) {
        // Persiste no localStorage e no DB antes de mostrar o game over screen
        clearActiveRun()
        saveCompletedSession(sessionId)
        try {
          await fetch('/api/runs/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, state: data.state }),
          })
        } catch {
          // Ignora falha — legado redireciona para / se não encontrar no DB
        }
        dispatch({ type: 'GAME_OVER', runState: data.state })
        return
      }

      const nextCard = data.nextCards?.[0] ?? null
      if (!nextCard) {
        dispatch({ type: 'ERROR', message: 'Servidor não retornou próxima carta — recarregue a página' })
        return
      }

      const nextBracketEntry = data.bracketEntry ?? state.bracketEntry!

      // Persiste estado atualizado no localStorage
      saveActiveRun({
        sessionId,
        state: data.state,
        bracketEntry: nextBracketEntry,
        currentCard: nextCard,
      })

      // Toast de gol quando um gol real é marcado (threshold de alvoVitoria cruzado)
      if (prevFase === 'reagir') {
        const alvo = prevBracketEntry.alvoVitoria
        const prevBra = Math.floor(prevGolsBrasil / alvo)
        const prevAdv = Math.floor(prevGolsAdversario / alvo)
        const newBra  = Math.floor(data.state.golsBrasil / alvo)
        const newAdv  = Math.floor(data.state.golsAdversario / alvo)
        if (newBra > prevBra || newAdv > prevAdv) {
          const minuto = REAGIR_MINUTO_NUM[prevCartasLen] ?? 88
          setGoalEvent({
            scored: newBra > prevBra,
            minuto,
            nome: state.runState.nomeJogador,
          })
        } else {
          // Gol sofrido por eco diferido (proximo_slot)
          const golSofrido = data.ecoToasts?.find(t => t.tipo === 'gol_sofrido')
          if (golSofrido) {
            setGoalEvent({
              scored: false,
              minuto: REAGIR_MINUTO_NUM[prevCartasLen] ?? 88,
              nome: state.runState.nomeJogador,
            })
          }
        }
      }

      // Detecta se vai haver troca de fase — se sim, mostra as barras/placar atualizados
      // por 700ms antes de mudar de tela (barras têm transition-duration 500ms)
      const upcomingTransition = detectTransition(prevFase, prevPartida, data.state.fase, data.state.partidaAtual)
      const needsPreview = upcomingTransition === 'match_start'
        || upcomingTransition === 'entrevista_start'
        || upcomingTransition === 'penaltis_start'

      if (needsPreview) {
        dispatch({ type: 'RESULT_PREVIEW', runState: data.state })
        await new Promise<void>(resolve => setTimeout(resolve, 700))
      }

      dispatch({
        type: 'ACTION_DONE',
        prevFase,
        prevPartida,
        prevPlacar,
        prevBracketEntry,
        runState: data.state,
        bracketEntry: nextBracketEntry,
        nextCard,
      })
    } catch (e) {
      dispatch({ type: 'ERROR', message: e instanceof Error ? e.message : 'Erro de rede' })
    }
  }

  const dismissTransition = useCallback(() => {
    dispatch({ type: 'DISMISS_TRANSITION' })
    setGoalEvent(null)
  }, [])

  const dismissJornal = useCallback(() => {
    dispatch({ type: 'DISMISS_JORNAL' })
  }, [])

  // ─── Render states ──────────────────────────────────────────────────────────

  if (state.status === 'loading') {
    return (
      <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-azul">
        <div className="w-8 h-8 border-2 border-amarelo border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (state.status === 'error' || !state.runState || !state.bracketEntry) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-azul px-6 text-center">
        <p className="text-white/60 mb-4">{state.error ?? 'Algo deu errado'}</p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-amarelo text-preto font-headline font-black text-sm"
        >
          Voltar ao Início
        </button>
      </div>
    )
  }

  // Tela de game over (antes do redirect para legado)
  if (state.showGameOver) {
    return (
      <GameOverScreen
        state={state.runState}
        onDone={() => router.push(`/legado/${sessionId}`)}
      />
    )
  }

  // Jornal: aparece após cada partida, antes da transição nova_partida
  if (state.showJornal && state.jornalRecord && state.runState) {
    return (
      <JornalScreen
        record={state.jornalRecord}
        sessionId={sessionId}
        runState={state.runState}
        onDismiss={dismissJornal}
      />
    )
  }

  // Tela de transição entre fases
  if (state.transition) {
    return (
      <TransitionScreen
        type={state.transition}
        bracketEntry={state.bracketEntry}
        partida={state.runState.partidaAtual}
        lastResult={state.lastResult}
        onDismiss={dismissTransition}
      />
    )
  }

  // Card de crise ativo? (não mostrar banner de pré-jogo durante crise)
  const isCriseActive = state.currentCard !== null &&
    'camada' in state.currentCard &&
    (state.currentCard as Carta).camada === 'crise'

  const isEcoCard = !!state.runState?.ecoPendente &&
    state.currentCard?.id === state.runState.ecoPendente

  const FASE_LABEL: Record<string, string> = {
    grupo: 'Fase de Grupos', oitavas: 'Oitavas de Final',
    quartas: 'Quartas de Final', semi: 'Semifinal', final: 'Final',
  }

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-papel">
      {/* ── Sticky: HUD + faixa de fase + placar ao vivo ── */}
      <div className="sticky top-0 z-40">
        <HUD state={state.runState} bracketEntry={state.bracketEntry} sessionId={sessionId} previewEfeitos={previewEfeitos} />

        {/* Faixa de cor indicando fase atual */}
        <div
          className="h-[3px] w-full"
          style={{
            background: state.runState.fase === 'planejar'
              ? 'var(--color-azul)'
              : state.runState.fase === 'reagir'
              ? 'var(--color-vermelho)'
              : state.runState.fase === 'penaltis'
              ? 'var(--color-amarelo)'
              : 'var(--color-verde)',
          }}
        />

        {/* Placar ao vivo — fica no sticky durante reagir/entrevista */}
        {(state.runState.fase === 'reagir' || state.runState.fase === 'entrevista') && (
          <LiveScoreboard
            golsBrasil={Math.floor(state.runState.golsBrasil / state.bracketEntry.alvoVitoria)}
            golsAdversario={Math.floor(state.runState.golsAdversario / state.bracketEntry.alvoVitoria)}
            adversario={state.bracketEntry.adversario}
            cartasRestantes={state.runState.cartasRestantes.length}
            finalizado={state.runState.fase === 'entrevista'}
          />
        )}
      </div>

      {/* ── Banner de pré-jogo (concentração) — não sticky ── */}
      {state.runState.fase === 'planejar' && !isCriseActive && (
        <div className="bg-papel border-b-2 border-preto/10 px-[15px] py-[14px]">
          <p className="font-headline font-bold text-[9px] tracking-[0.2em] uppercase text-preto/40 mb-[4px]">
            Concentração · Jogo {state.runState.partidaAtual} de 7
          </p>
          <h2 className="font-headline font-black italic text-[28px] leading-[0.9] tracking-[-1px] text-preto">
            vs {state.bracketEntry.adversario}
          </h2>
          <div className="flex items-center gap-[5px] mt-[8px] mb-[6px]">
            {Array.from({ length: state.runState.cartasRestantes.length }).map((_, i) => (
              <span key={i} className="w-[6px] h-[6px] rounded-full bg-preto/25" />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span
              className="font-headline font-bold text-[9px] tracking-[0.05em] uppercase text-white px-[8px] py-[3px]"
              style={{ background: 'var(--color-azul)', transform: 'skewX(-6deg)' }}
            >
              {FASE_LABEL[state.bracketEntry.fase] ?? state.bracketEntry.fase}
            </span>
            <Link
              href={`/historico/${sessionId}`}
              className="font-headline font-bold text-[11px] tracking-[0.05em] uppercase text-preto/50 border-2 border-preto/20 px-[10px] py-[5px] hover:bg-preto hover:text-white transition-colors"
            >
              Edições →
            </Link>
          </div>
        </div>
      )}

      {/* ── Banner de pênaltis ── */}
      {state.runState.fase === 'penaltis' && (
        <div className="bg-preto border-b-2 border-amarelo/30 px-[15px] py-[14px]">
          <p className="font-headline font-bold text-[9px] tracking-[0.2em] uppercase text-white/40 mb-[4px]">
            Pênaltis · {state.bracketEntry.adversario}
          </p>
          <h2 className="font-headline font-black italic text-[28px] leading-[0.9] tracking-[-1px] text-amarelo">
            COBRANÇA
          </h2>
          <div className="flex items-center gap-[5px] mt-[8px]">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className={`w-[6px] h-[6px] rounded-full ${
                  i < 3 - state.runState!.cartasRestantes.length
                    ? 'bg-amarelo'
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col pt-3 min-h-0 overflow-hidden">
        {state.currentCard ? (
          <Card
            card={state.currentCard}
            arquetipo={state.runState.arquetipo}
            tokens={state.runState.tokens}
            onChoice={(lado) => { setShowSwipeHint(false); handleChoice(lado) }}
            onPreview={setPreviewEfeitos}
            disabled={state.isSubmitting}
            showHint={showSwipeHint}
            isEco={isEcoCard}
          />
        ) : (
          <div className="flex flex-col flex-1 items-center justify-center">
            <div className="w-6 h-6 border-2 border-azul border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {state.error && (
        <div className="fixed bottom-6 z-50 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[448px]">
          <div className="bg-vermelho text-white px-4 py-3 font-headline font-bold text-sm text-center"
            style={{ boxShadow: '3px 3px 0 #100F0D' }}>
            {state.error} — tente novamente
          </div>
        </div>
      )}

      {goalEvent && (
        <GoalToast event={goalEvent} onDone={() => setGoalEvent(null)} />
      )}
    </div>
  )
}
