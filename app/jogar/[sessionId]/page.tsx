'use client'

import { useEffect, useReducer } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { BracketEntry, Carta, CartaEntrevista, RunState } from '@/engine/types'
import type { ActionResponse, RunStateResponse } from '@/lib/api-types'
import HUD from '@/components/ui/HUD'
import Card from '@/components/ui/Card'

// ─── State ───────────────────────────────────────────────────────────────────

type GameStatus = 'loading' | 'playing' | 'error'

type GameState = {
  status: GameStatus
  runState: RunState | null
  bracketEntry: BracketEntry | null
  currentCard: Carta | CartaEntrevista | null
  isSubmitting: boolean
  error: string | null
}

const initial: GameState = {
  status: 'loading',
  runState: null,
  bracketEntry: null,
  currentCard: null,
  isSubmitting: false,
  error: null,
}

type GameAction =
  | { type: 'LOADED'; runState: RunState; bracketEntry: BracketEntry; card: Carta | CartaEntrevista }
  | { type: 'SUBMITTING' }
  | { type: 'ACTION_DONE'; runState: RunState; nextCard: Carta | CartaEntrevista | null }
  | { type: 'ERROR'; message: string }

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'LOADED':
      return {
        ...state,
        status: 'playing',
        runState: action.runState,
        bracketEntry: action.bracketEntry,
        currentCard: action.card,
        isSubmitting: false,
        error: null,
      }
    case 'SUBMITTING':
      return { ...state, isSubmitting: true, error: null }
    case 'ACTION_DONE':
      return {
        ...state,
        runState: action.runState,
        currentCard: action.nextCard,
        isSubmitting: false,
      }
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
    if (!state.currentCard || state.isSubmitting) return

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

      const nextCard = data.nextCards?.[0] ?? null
      dispatch({ type: 'ACTION_DONE', runState: data.state, nextCard })
    } catch (e) {
      dispatch({ type: 'ERROR', message: e instanceof Error ? e.message : 'Erro de rede' })
    }
  }

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
          className="px-6 py-3 rounded-xl bg-amarelo text-preto font-headline font-black text-sm"
        >
          Voltar ao Início
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-papel">
      <HUD state={state.runState} bracketEntry={state.bracketEntry} />

      <div className="flex-1 flex flex-col pt-4">
        {state.currentCard ? (
          <Card
            card={state.currentCard}
            arquetipo={state.runState.arquetipo}
            onChoice={handleChoice}
            disabled={state.isSubmitting}
          />
        ) : (
          /* Transição entre fases — animação sutil */
          <div className="flex flex-col flex-1 items-center justify-center">
            <div className="w-6 h-6 border-2 border-azul border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Toast de erro de rede */}
      {state.error && (
        <div className="fixed bottom-6 left-4 right-4 z-50">
          <div className="bg-vermelho text-white px-4 py-3 rounded-xl font-headline font-bold text-sm text-center shadow-lg">
            {state.error} — tente novamente
          </div>
        </div>
      )}
    </div>
  )
}
