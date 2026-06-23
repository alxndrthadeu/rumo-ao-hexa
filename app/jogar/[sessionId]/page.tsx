'use client'

import { useCallback, useEffect, useReducer, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { BracketEntry, Carta, CartaEntrevista, RunState } from '@/engine/types'
import type { ActionResponse, RunStateResponse } from '@/lib/api-types'
import HUD from '@/components/ui/HUD'
import Card from '@/components/ui/Card'
import GroupResult from '@/components/ui/GroupResult'
import TransitionScreen, { type TransitionType } from '@/components/ui/TransitionScreen'
import GoalToast, { type GoalEvent } from '@/components/ui/GoalToast'

// ─── Minutos simbólicos por posição no deck de reagir ────────────────────────
// cartasRestantes.length antes da escolha: 3 → 1ª carta, 2 → 2ª carta, 1 → 3ª carta
const REAGIR_MINUTO: Record<number, number> = { 3: 22, 2: 55, 1: 88 }

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
  isSubmitting: false,
  error: null,
}

type GameAction =
  | { type: 'LOADED'; runState: RunState; bracketEntry: BracketEntry; card: Carta | CartaEntrevista }
  | { type: 'SUBMITTING' }
  | { type: 'ACTION_DONE'; prevFase: string; prevPartida: number; prevPlacar: number; prevBracketEntry: BracketEntry; runState: RunState; bracketEntry: BracketEntry; nextCard: Carta | CartaEntrevista | null }
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
      // Captura resultado da partida ao terminar entrevista
      const lastResult: LastResult | null =
        action.prevFase === 'entrevista' && action.runState.fase === 'planejar'
          ? { adversario: action.prevBracketEntry.adversario, placarDelta: action.prevPlacar }
          : state.lastResult
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
  const [groupResultDismissed, setGroupResultDismissed] = useState(false)
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

    const prevFase       = state.runState.fase
    const prevPartida    = state.runState.partidaAtual
    const prevPlacar     = state.runState.placarPartida
    const prevCartasLen  = state.runState.cartasRestantes.length
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
        router.push(`/legado/${sessionId}`)
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

  // Tabela do grupo (após partida 3, antes de oitavas)
  const showGroupResult = state.runState.partidaAtual === 4 && !groupResultDismissed
  if (showGroupResult) {
    return <GroupResult onContinue={() => setGroupResultDismissed(true)} />
  }

  return (
    <div className="flex flex-col min-h-screen bg-papel">
      <HUD state={state.runState} bracketEntry={state.bracketEntry} />

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

      <div className="flex-1 flex flex-col pt-4">
        {state.currentCard ? (
          <Card
            card={state.currentCard}
            arquetipo={state.runState.arquetipo}
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
        <div className="fixed bottom-6 left-4 right-4 z-50">
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
