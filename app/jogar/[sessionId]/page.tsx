'use client'

import { useCallback, useEffect, useReducer, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import type { BracketEntry, Carta, CartaEntrevista, MatchRecord, RunState } from '@/engine/types'
import type { ActionResponse, RunStateResponse } from '@/lib/api-types'
import HUD from '@/components/ui/HUD'
import Card from '@/components/ui/Card'
import TransitionScreen, { type TransitionType } from '@/components/ui/TransitionScreen'
import GoalToast, { type GoalEvent } from '@/components/ui/GoalToast'
import GameOverScreen from '@/components/ui/GameOverScreen'
import JornalScreen from '@/components/ui/JornalScreen'
import LiveScoreboard from '@/components/ui/LiveScoreboard'

// Minuto simbólico por cartas restantes antes da escolha (5 cartas no deck)
const REAGIR_MINUTO: Record<number, number> = { 5: 15, 4: 45, 3: 60, 2: 88, 1: 90 }

// ─── State ───────────────────────────────────────────────────────────────────

type GameStatus = 'loading' | 'playing' | 'error'

type LastResult = { adversario: string; placarDelta: number }

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
  | { type: 'ACTION_DONE'; prevFase: string; prevPartida: number; prevPlacar: number; prevBracketEntry: BracketEntry; runState: RunState; bracketEntry: BracketEntry; nextCard: Carta | CartaEntrevista | null }
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
  if (prevFase === 'planejar' && newFase === 'reagir') return 'match_start'
  if (prevFase === 'reagir'   && newFase === 'entrevista') return 'entrevista_start'
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
    case 'ACTION_DONE': {
      const transition = detectTransition(
        action.prevFase,
        action.prevPartida,
        action.runState.fase,
        action.runState.partidaAtual
      )

      // lastResult: reagir→entrevista usa placar final do reagir; entrevista→planejar usa prevPlacar
      const lastResult: LastResult | null =
        action.prevFase === 'entrevista' && action.runState.fase === 'planejar'
          ? { adversario: action.prevBracketEntry.adversario, placarDelta: action.prevPlacar }
        : action.prevFase === 'reagir' && action.runState.fase === 'entrevista'
          ? { adversario: action.prevBracketEntry.adversario, placarDelta: action.runState.placarPartida }
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

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/run/${sessionId}`)
        if (!res.ok) throw new Error('Sessão não encontrada')

        const data: RunStateResponse = await res.json()

        if (data.isGameOver) {
          router.replace(`/legado/${sessionId}`)
          return
        }

        const card = data.cards?.[0] ?? null
        if (!card) throw new Error('Sem cartas disponíveis')

        dispatch({ type: 'LOADED', runState: data.state, bracketEntry: data.bracketEntry, card })
      } catch (e) {
        dispatch({ type: 'ERROR', message: e instanceof Error ? e.message : 'Erro ao carregar' })
      }
    }

    load()
  }, [sessionId, router])

  async function handleChoice(lado: 'esquerda' | 'direita') {
    if (!state.currentCard || state.isSubmitting || !state.runState) return

    const prevFase        = state.runState.fase
    const prevPartida     = state.runState.partidaAtual
    const prevPlacar      = state.runState.placarPartida
    const prevCartasLen   = state.runState.cartasRestantes.length
    const prevBracketEntry = state.bracketEntry!

    dispatch({ type: 'SUBMITTING' })

    try {
      const res = await fetch(`/api/run/${sessionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: state.currentCard.id, escolha: lado }),
      })

      if (!res.ok) throw new Error('Erro ao enviar escolha')

      const data: ActionResponse = await res.json()

      if (data.isGameOver) {
        dispatch({ type: 'GAME_OVER', runState: data.state })
        return
      }

      // Toast de gol/gol sofrido quando estávamos na fase reagir
      if (prevFase === 'reagir' && data.state.placarPartida !== prevPlacar) {
        const minuto = REAGIR_MINUTO[prevCartasLen] ?? 88
        setGoalEvent({
          scored: data.state.placarPartida > prevPlacar,
          minuto,
          nome: state.runState.nomeJogador,
        })
      }

      const nextCard = data.nextCards?.[0] ?? null
      dispatch({
        type: 'ACTION_DONE',
        prevFase,
        prevPartida,
        prevPlacar,
        prevBracketEntry,
        runState: data.state,
        bracketEntry: data.bracketEntry ?? state.bracketEntry!,
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

  const FASE_LABEL: Record<string, string> = {
    grupo: 'Fase de Grupos', oitavas: 'Oitavas de Final',
    quartas: 'Quartas de Final', semi: 'Semifinal', final: 'Final',
  }

  return (
    <div className="flex flex-col min-h-screen bg-papel">
      <HUD state={state.runState} bracketEntry={state.bracketEntry} sessionId={sessionId} />

      {/* Faixa de cor indicando fase atual */}
      <div
        className="h-[3px] w-full"
        style={{
          background: state.runState.fase === 'planejar'
            ? 'var(--color-azul)'
            : state.runState.fase === 'reagir'
            ? 'var(--color-vermelho)'
            : 'var(--color-verde)',
        }}
      />

      {/* ── Banner de pré-jogo (concentração) ── */}
      {state.runState.fase === 'planejar' && !isCriseActive && (
        <div className="bg-papel border-b-2 border-preto/10 px-[15px] py-[14px]">
          <p className="font-headline font-bold text-[9px] tracking-[0.2em] uppercase text-preto/40 mb-[4px]">
            Concentração · Jogo {state.runState.partidaAtual} de 7
          </p>
          <h2 className="font-headline font-black italic text-[28px] leading-[0.9] tracking-[-1px] text-preto">
            vs {state.bracketEntry.adversario}
          </h2>
          <div className="flex items-center justify-between mt-[8px]">
            <div className="flex items-center gap-[8px]">
              <span
                className="font-headline font-bold text-[9px] tracking-[0.05em] uppercase text-white px-[8px] py-[3px]"
                style={{ background: 'var(--color-azul)', transform: 'skewX(-6deg)' }}
              >
                {FASE_LABEL[state.bracketEntry.fase] ?? state.bracketEntry.fase}
              </span>
            </div>
            <Link
              href={`/historico/${sessionId}`}
              className="font-headline font-bold text-[11px] tracking-[0.05em] uppercase text-preto/50 border-2 border-preto/20 px-[10px] py-[5px] hover:bg-preto hover:text-white transition-colors"
            >
              Edições →
            </Link>
          </div>
        </div>
      )}

      {/* ── Placar ao vivo (reagir) ── */}
      {state.runState.fase === 'reagir' && (
        <LiveScoreboard
          golsBrasil={state.runState.golsBrasil}
          golsAdversario={state.runState.golsAdversario}
          adversario={state.bracketEntry.adversario}
          cartasRestantes={state.runState.cartasRestantes.length}
        />
      )}

      <div className="flex-1 flex flex-col pt-3">
        {state.currentCard ? (
          <Card
            card={state.currentCard}
            arquetipo={state.runState.arquetipo}
            tokens={state.runState.tokens}
            onChoice={handleChoice}
            disabled={state.isSubmitting}
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
