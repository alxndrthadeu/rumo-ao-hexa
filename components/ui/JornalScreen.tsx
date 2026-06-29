'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { MatchRecord, RunState } from '@/engine/types'

// ─── Fake news ───────────────────────────────────────────────────────────────

const FAKE_NEWS: Array<{ secao: string; titulo: string }> = [
  // Superstição / fé
  { secao: 'TORCIDA',      titulo: '78% dos brasileiros assistem ao jogo de cueca, diz Ibope' },
  { secao: 'FÉ',           titulo: 'Padre reza terço por 90 minutos em frente à TV. "Deus ouviu nos pênaltis"' },
  { secao: 'TRADIÇÃO',     titulo: 'Torcedor usa a mesma cueca de 2002. "Vou até o Hexa ou a cremação"' },
  { secao: 'PROMESSA',     titulo: 'Bispo promete raspar a cabeça se Brasil ganhar. Barbearia já de prontidão' },
  { secao: 'REZA BRAVA',   titulo: 'Vovó de Fortaleza reza desde 2018 sem parar. "Agora sim, meu filho"' },
  { secao: 'EXCLUSIVO',    titulo: 'Pizzaiolo de BH diz ter previsto o placar em sonho na véspera' },
  // Galvão / mídia
  { secao: 'GLOBO',        titulo: 'Comentarista chora pela 7ª vez no torneio. "São só 7 jogos", diz ele' },
  { secao: 'TV',           titulo: 'Canal passa 18 horas analisando o lateral-direito reserva. Ele não jogou' },
  { secao: 'EXCLUSIVO',    titulo: 'Comentarista previu placar errado 7 vezes. "Mas acertei o vencedor"' },
  { secao: 'NARRAÇÃO',     titulo: '"Mais dramático que novela das 9", diz telespectadora sobre narração do gol' },
  { secao: 'MÍDIA',        titulo: 'Repórter usa metonímia no lugar de metáfora há 12 anos. Ainda não percebeu' },
  { secao: 'GLOBO',        titulo: 'Globo cogita não transmitir derrota. Fonte: "absolutamente falsa"' },
  // CBF / FIFA
  { secao: 'CBF',          titulo: 'CBF distribui 3.000 camisetas nos treinos — sobraram 2.997' },
  { secao: 'ARBITRAGEM',   titulo: 'Árbitro tem 23 anos de carreira e nunca apitou o Brasil. Por enquanto.' },
  { secao: 'FIFA',         titulo: "Garrafa d'água no camarote custa R$ 47 — FIFA diz que é preço justo" },
  { secao: 'CBF',          titulo: 'Presidente da CBF garante que uniforme não encolhe. Jogadores discordam em silêncio' },
  { secao: 'COPA',         titulo: 'FIFA vende kit exclusivo "Campeão" para todos os 32 países. "Precaução"' },
  { secao: 'BASTIDORES',   titulo: 'Comissão técnica confirma: existe galinha mascote. Ela se chama Vitória' },
  // Redes sociais / jogadores
  { secao: 'REDES',        titulo: 'Neymar posta foto de pijama e a web para: "Sonhando com o Hexa?"' },
  { secao: 'INSTAGRAM',    titulo: 'Jogador posta treino às 5h da manhã. Curtiu própria foto sem querer' },
  { secao: 'TWITTER/X',    titulo: 'Rodrygo troca foto de perfil e analistas veem sinal de gol iminente' },
  { secao: 'STORIES',      titulo: 'Goleiro posta "🙏" e torcida interpreta como: classificação confirmada' },
  { secao: 'MERCADO',      titulo: 'Palmeiras nega interesse em craque gerado por inteligência artificial' },
  { secao: 'VINI JR',      titulo: 'Vini Jr. celebra gol com dança inédita. Dicionário de memes já atualizado' },
  // Estádio / organização
  { secao: 'ORGANIZAÇÃO',  titulo: 'Fila para banheiro no estádio move-se mais rápido que a defesa adversária' },
  { secao: 'COPA',         titulo: 'Arquiteto do estádio diz que o calor "faz parte da experiência"' },
  { secao: 'SEGURANÇA',    titulo: 'Segurança confisca coxinha de torcedor. "Risco potencial", diz agente' },
  { secao: 'HOTEL',        titulo: 'Hotel da seleção serve macarrão toda quarta. "É o dia do macarrão", diz nutricionista' },
  // Análise de botequim
  { secao: 'ANÁLISE',      titulo: 'Especialista usa xadrez, pôquer e xícara de café para explicar o 4-3-3' },
  { secao: 'TÁTICA',       titulo: '"A bola tem que entrar no gol", resume técnico em entrevista de 40 minutos' },
  { secao: 'OPTA',         titulo: 'Brasil tem 99,3% de posse nos arremessos laterais a seu favor, diz Opta' },
  { secao: 'GPS',          titulo: 'Lateral-direito percorreu maratona completa. "Foi o que pareceu", diz ele' },
  // Política / Brasil
  { secao: 'POLÍTICA',     titulo: 'Lula: "Se ganhar o Hexa, decreto feriado de 30 dias corridos"' },
  { secao: 'CÂMARA',       titulo: 'Deputado entra com projeto para mudar o hino se o Brasil ganhar' },
  { secao: 'IBGE',         titulo: 'Produção de coxinha cresce 340% durante a Copa, confirma IBGE' },
  // Absurdo / humor
  { secao: 'BREAKING',     titulo: 'Homem que desligou a TV no pênalti é encontrado bem. Família agradece' },
  { secao: 'INÉDITO',      titulo: 'Torcedor assiste jogo de olhos fechados. "Eu sinto quando vai entrar"' },
  { secao: 'BOTEQUIM',     titulo: 'Bar de SP registra recorde de pedido de cerveja no minuto do apito final' },
  { secao: 'CACHORRO',     titulo: 'Cachorro late durante hino do Brasil. Dono diz que "ele sempre faz isso"' },
  // VAR
  { secao: 'VAR',          titulo: 'VAR revisa lance por 8 minutos e conclui que "era falta mesmo, sim"' },
  { secao: 'ÁRBITRO',      titulo: 'Árbitro explica decisão polêmica: "O regulamento diz isso. Mais ou menos."' },
  { secao: 'VAR',          titulo: 'Tecnologia de linha do impedimento confirma: fora por 0,3 milímetros de sombra' },
]

function getFakeNews(partida: number, initialSeed: number) {
  const offset = (initialSeed % 37)
  const base = ((partida - 1) * 3 + offset) % FAKE_NEWS.length
  return [0, 1, 2].map(i => FAKE_NEWS[(base + i * 13) % FAKE_NEWS.length])
}

// ─── Pull quotes ──────────────────────────────────────────────────────────────

const PULL_QUOTES: Record<string, string[]> = {
  vitoria:  [
    '"Quando o Brasil acredita de verdade, ninguém segura."',
    '"Não é sorte. É Copa do Mundo. É Brasil."',
    '"Em campo ou na arquibancada, o Brasil vibrou igual."',
    '"Esse time tem algo que não aparece em estatística."',
  ],
  derrota:  [
    '"O futebol cobra. Sempre cobra."',
    '"A dor de hoje é o combustível de amanhã."',
    '"A Copa é implacável. Não há segunda chance aqui."',
  ],
  empate:   [
    '"Um ponto conquistado é um ponto que o adversário não tem."',
    '"Nem sempre o melhor futebol decide. Mas o resultado fica."',
    '"O empate não é derrota. É ponto disputado e garantido."',
  ],
  penaltis: [
    '"Pênalti é mais sorte que ciência. Pergunta ao goleiro."',
    '"Segundos que parecem eternos. O Brasil resistiu."',
    '"Na loteria, vence quem está com a cabeça mais fria."',
  ],
}

function getPullQuote(resultado: string, partida: number, seed: number): string {
  const pool = PULL_QUOTES[resultado] ?? PULL_QUOTES.vitoria
  return pool[(partida + seed) % pool.length]
}

const JORNALISTAS = [
  'Marcelo Sá Fortes', 'Ana Luísa Cardoso', 'Roberto Motta',
  'Carla Simões',      'Paulo Barros Jr.',   'Fernanda Lacerda',
  'Diego Castilho',
]

function getJornalista(partida: number, seed: number): string {
  return JORNALISTAS[(partida * 3 + seed) % JORNALISTAS.length]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RESULTADO_LABEL: Record<string, string> = {
  vitoria:  'Vitória',
  empate:   'Empate',
  derrota:  'Derrota',
  penaltis: 'Pênaltis',
}

const RESULTADO_BG: Record<string, string> = {
  vitoria:  'var(--color-verde)',
  empate:   'var(--color-azul)',
  derrota:  'var(--color-vermelho)',
  penaltis: 'var(--color-verde)',
}

const FASE_LABEL: Record<string, string> = {
  grupo:   'Fase de Grupos',
  oitavas: 'Oitavas de Final',
  quartas: 'Quartas de Final',
  semi:    'Semifinal',
  final:   'Final',
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function DoubleRule() {
  return (
    <div>
      <div className="border-t-[3px]" style={{ borderColor: 'var(--color-line)' }} />
      <div className="mt-[2px] border-t" style={{ borderColor: 'var(--color-line)', opacity: 0.25 }} />
    </div>
  )
}

function PlacarBox({ record }: { record: MatchRecord }) {
  const advAbrev = record.adversario.slice(0, 3).toUpperCase()
  return (
    <div className="flex-1 p-[12px]" style={{ background: 'var(--color-line)' }}>
      <p className="font-headline font-bold text-[8px] tracking-[0.2em] uppercase mb-[8px]"
        style={{ color: 'var(--color-hud-ink)', opacity: 0.4 }}>
        Placar Final
      </p>
      <div className="flex items-baseline gap-[6px]">
        <span className="font-headline font-black italic text-[11px]"
          style={{ color: 'var(--color-hud-ink)', opacity: 0.6 }}>BRA</span>
        <span className="font-headline font-black italic text-[30px] leading-none tracking-[-1px]"
          style={{ color: 'var(--color-hud-ink)' }}>
          {record.golsBrasil} × {record.golsAdversario}
        </span>
        <span className="font-headline font-black italic text-[11px]"
          style={{ color: 'var(--color-hud-ink)', opacity: 0.4 }}>{advAbrev}</span>
      </div>
      <p className="font-headline font-bold text-[9px] mt-[3px] tracking-[0.05em] uppercase"
        style={{ color: 'var(--color-hud-ink)', opacity: 0.35 }}>
        {record.adversario}
      </p>
    </div>
  )
}

function GrupoBox({ runState }: { runState: RunState }) {
  const historico = runState.historicoPartidas.filter(h => h.fase === 'grupo')
  const v = historico.filter(h => h.resultado === 'vitoria').length
  const e = historico.filter(h => h.resultado === 'empate').length
  const d = historico.filter(h => h.resultado === 'derrota').length
  const pts = runState.pontosGrupo
  const classificado = pts >= 5
  return (
    <div className="flex-1 p-[12px]" style={{ border: 'var(--border-w) solid var(--color-line)' }}>
      <p className="font-headline font-bold text-[8px] tracking-[0.2em] uppercase mb-[8px]"
        style={{ color: 'var(--color-ink)', opacity: 0.4 }}>
        Grupo G
      </p>
      <p className="font-headline font-black italic text-[30px] leading-none tracking-[-1px]"
        style={{ color: 'var(--color-ink)' }}>
        {pts}<span className="text-[14px] font-bold tracking-normal"> pts</span>
      </p>
      <p className="font-headline font-bold text-[10px] mt-[2px]"
        style={{ color: 'var(--color-ink)', opacity: 0.55 }}>
        {v}V {e}E {d}D
      </p>
      {classificado && (
        <span
          className="inline-block font-headline font-black italic text-[8px] tracking-[0.1em] uppercase px-[6px] py-[2px] mt-[4px]"
          style={{ background: 'var(--color-verde)', color: '#fff' }}
        >
          Classificado
        </span>
      )}
    </div>
  )
}

// ─── JornalScreen ────────────────────────────────────────────────────────────

export default function JornalScreen({
  record,
  sessionId,
  runState,
  onDismiss,
}: {
  record: MatchRecord
  sessionId: string
  runState: RunState
  onDismiss: () => void
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  const seedOffset      = runState.initialSeed % 7
  const fakeNews        = getFakeNews(record.partida, runState.initialSeed)
  const pullQuote       = getPullQuote(record.resultado, record.partida, seedOffset)
  const jornalista      = getJornalista(record.partida, seedOffset)
  const isGrupo         = record.fase === 'grupo'
  const resultadoCor    = RESULTADO_BG[record.resultado] ?? 'var(--color-line)'
  const resultadoLabel  = RESULTADO_LABEL[record.resultado] ?? record.resultado
  const faseLabel       = FASE_LABEL[record.fase] ?? record.fase

  const corpo      = record.corpo
  const corpoPrime = corpo.charAt(0)
  const corpoRest  = corpo.slice(1)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col md:flex-row md:justify-center"
      style={{ background: 'var(--color-hud)', opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease' }}
    >
      <div className="w-full md:max-w-[480px] flex flex-col overflow-y-auto"
        style={{ background: 'var(--color-surface)' }}>

        {/* ── Masthead ── */}
        <div className="px-[20px] pt-[44px] pb-[0px] flex-shrink-0">
          <div className="h-[4px] w-full mb-[12px]" style={{ background: resultadoCor }} />

          <div className="flex items-start justify-between mb-[6px]">
            <div>
              <p
                className="font-headline font-black italic text-[18px] tracking-[0.25em] uppercase leading-none"
                style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-head)' }}
              >
                Diário da Copa
              </p>
              <p className="font-headline font-bold text-[8px] tracking-[0.12em] uppercase mt-[2px]"
                style={{ color: 'var(--color-ink)', opacity: 0.35 }}>
                A verdade verdadeira do futebol brasileiro
              </p>
            </div>
            <div className="text-right shrink-0 ml-[12px]">
              <p className="font-headline font-bold text-[9px] tracking-[0.08em] uppercase"
                style={{ color: 'var(--color-ink)', opacity: 0.5 }}>
                Edição Nº {record.partida}
              </p>
              <p className="font-headline font-bold text-[8px] mt-[1px]"
                style={{ color: 'var(--color-ink)', opacity: 0.3 }}>
                R$ 5,90
              </p>
            </div>
          </div>

          {/* Dateline */}
          <div className="flex items-center gap-[6px] mb-[10px]">
            {['Copa do Mundo 2026', faseLabel, 'EUA / CAN / MEX'].map((item, i, arr) => (
              <span key={item} className="flex items-center gap-[6px]">
                <span className="font-headline font-bold text-[8px] tracking-[0.15em] uppercase"
                  style={{ color: 'var(--color-ink)', opacity: 0.4 }}>
                  {item}
                </span>
                {i < arr.length - 1 && (
                  <span className="text-[8px]" style={{ color: 'var(--color-ink)', opacity: 0.25 }}>·</span>
                )}
              </span>
            ))}
          </div>

          <DoubleRule />
        </div>

        {/* ── Resultado + Manchete ── */}
        <div className="px-[20px] pt-[16px] flex-shrink-0">
          <div className="flex items-center gap-[8px] mb-[12px]">
            <span
              className="font-headline font-black italic text-[10px] tracking-[0.2em] uppercase px-[9px] py-[3px]"
              style={{ background: resultadoCor, color: '#fff', transform: 'skewX(-6deg)', display: 'inline-block' }}
            >
              {resultadoLabel}
            </span>
            <span className="font-headline font-bold text-[9px] tracking-[0.12em] uppercase"
              style={{ color: 'var(--color-ink)', opacity: 0.4 }}>
              Brasil vs {record.adversario}
            </span>
          </div>

          {/* Kicker em vermelho */}
          <p className="font-headline font-bold text-[9px] tracking-[0.15em] uppercase mb-[6px]"
            style={{ color: 'var(--color-vermelho)' }}>
            Manchete
          </p>

          <h1
            className="font-headline font-black italic leading-[0.9] tracking-[-1.5px] mb-[10px]"
            style={{ fontSize: 'var(--fs-title)', color: 'var(--color-ink)', fontFamily: 'var(--font-head)' }}
          >
            {record.manchete}
          </h1>

          {/* Byline */}
          <div
            className="py-[6px] mb-[14px] flex items-center justify-between"
            style={{ borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'color-mix(in srgb, var(--color-line) 35%, transparent)' }}
          >
            <p className="font-headline font-bold text-[9px] tracking-[0.08em] uppercase"
              style={{ color: 'var(--color-ink)', opacity: 0.4 }}>
              Por {jornalista} · Enviado Especial
            </p>
            <p className="font-headline font-bold text-[9px]"
              style={{ color: 'var(--color-ink)', opacity: 0.25 }}>
              Copa 2026
            </p>
          </div>

          {/* Placeholder de foto */}
          <div
            className="w-full mb-[14px] relative overflow-hidden"
            style={{
              aspectRatio: '16 / 7',
              border: 'var(--border-w) solid var(--color-line)',
              borderRadius: 'var(--radius)',
            }}
          >
            <div
              className="absolute inset-0"
              style={{ background: 'repeating-linear-gradient(135deg, var(--bar-track) 0 9px, transparent 9px 18px)' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="font-headline font-bold text-[9px] tracking-[0.1em] uppercase"
                style={{ color: 'var(--color-ink)', opacity: 0.2 }}
              >
                [ Foto — Lance do Gol ]
              </span>
            </div>
          </div>

          {/* Corpo com drop cap */}
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-body)', lineHeight: 'var(--body-lh)', color: 'var(--color-ink)', opacity: 0.72 }}>
            <span
              className="float-left font-headline font-black italic leading-[0.78] mr-[5px] mt-[3px]"
              style={{ fontSize: 'clamp(40px, 10vw, 54px)', color: 'var(--color-ink)', fontFamily: 'var(--font-head)', opacity: 1 }}
            >
              {corpoPrime}
            </span>
            {corpoRest}
          </p>

          {/* Pull quote */}
          <div
            className="my-[18px] pl-[14px] py-[10px]"
            style={{ borderLeft: '4px solid var(--color-line)' }}
          >
            <p className="font-headline font-black italic text-[15px] leading-[1.2] tracking-[-0.3px]"
              style={{ color: 'var(--color-ink)', opacity: 0.8 }}>
              {pullQuote}
            </p>
          </div>
        </div>

        {/* ── Flags de destaque ── */}
        {record.flagsDestaque.length > 0 && (
          <div className="px-[20px] flex flex-wrap gap-[5px] flex-shrink-0">
            {record.flagsDestaque.map(flag => (
              <span
                key={flag}
                className="font-headline font-bold text-[8px] tracking-[0.2em] uppercase px-[7px] py-[3px]"
                style={{ border: '1px solid', borderColor: 'color-mix(in srgb, var(--color-line) 40%, transparent)', color: 'var(--color-ink)', opacity: 0.4 }}
              >
                #{flag.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}

        {/* ── Boletim da Copa ── */}
        <div className="px-[20px] mt-[22px] flex-shrink-0">
          <div
            className="flex items-center gap-[8px] mb-[10px] pb-[6px]"
            style={{ borderBottom: '2px solid var(--color-line)' }}
          >
            <span
              className="font-headline font-black italic text-[9px] tracking-[0.15em] uppercase px-[7px] py-[2px]"
              style={{ background: 'var(--color-line)', color: 'var(--color-hud-ink)' }}
            >
              Boletim
            </span>
            <span className="font-headline font-bold text-[8px] tracking-[0.15em] uppercase"
              style={{ color: 'var(--color-ink)', opacity: 0.4 }}>
              Copa do Mundo 2026
            </span>
          </div>
          <div className="flex gap-[8px]">
            <PlacarBox record={record} />
            {isGrupo && <GrupoBox runState={runState} />}
            {!isGrupo && (
              <div className="flex-1 p-[12px] flex flex-col justify-center"
                style={{ border: 'var(--border-w) solid var(--color-line)' }}>
                <p className="font-headline font-bold text-[8px] tracking-[0.2em] uppercase mb-[6px]"
                  style={{ color: 'var(--color-ink)', opacity: 0.4 }}>
                  Mata-mata
                </p>
                <span
                  className="font-headline font-black italic text-[12px] tracking-[0.05em] uppercase px-[8px] py-[4px] inline-block"
                  style={{
                    background: (record.resultado === 'vitoria' || record.resultado === 'penaltis')
                      ? 'var(--color-verde)'
                      : 'var(--color-vermelho)',
                    color: '#fff',
                  }}
                >
                  {record.resultado === 'vitoria'
                    ? 'Classificado'
                    : record.resultado === 'penaltis'
                    ? 'Via Pênaltis'
                    : 'Eliminado'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Outras Notícias ── */}
        <div className="px-[20px] mt-[24px] flex-shrink-0">
          <div
            className="flex items-center gap-[8px] mb-[12px] pb-[6px]"
            style={{ borderBottom: '2px solid var(--color-line)' }}
          >
            <span
              className="font-headline font-black italic text-[9px] tracking-[0.15em] uppercase px-[7px] py-[2px]"
              style={{ background: 'var(--color-line)', color: 'var(--color-hud-ink)' }}
            >
              Expediente
            </span>
            <span className="font-headline font-bold text-[8px] tracking-[0.15em] uppercase"
              style={{ color: 'var(--color-ink)', opacity: 0.4 }}>
              Notícias da Copa
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-[14px]">
            {fakeNews.map((n, i) => (
              <div
                key={i}
                className="py-[9px]"
                style={{ borderBottom: '1px solid', borderColor: 'color-mix(in srgb, var(--color-line) 30%, transparent)' }}
              >
                <span
                  className="font-headline font-black italic text-[7px] tracking-[0.08em] uppercase px-[4px] py-[1px] mb-[4px] inline-block"
                  style={{ background: 'var(--color-line)', color: 'var(--color-hud-ink)' }}
                >
                  {n.secao}
                </span>
                <p className="text-[11px] leading-[1.35]" style={{ color: 'var(--color-ink)', opacity: 0.6 }}>
                  {n.titulo}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Espaçador ── */}
        <div className="flex-1 min-h-[24px]" />

        {/* ── Rodapé ── */}
        <div className="flex-shrink-0 mt-[24px]">
          <DoubleRule />
          <div className="px-[20px] py-[8px]">
            <p className="font-headline font-bold text-[7px] tracking-[0.12em] uppercase text-center"
              style={{ color: 'var(--color-ink)', opacity: 0.25 }}>
              Impresso no Brasil · Copa do Mundo 2026 · Proibida reprodução
            </p>
          </div>
          <div className="border-t" style={{ borderColor: 'color-mix(in srgb, var(--color-line) 30%, transparent)' }} />
          <div className="px-[20px] py-[20px] flex items-center justify-between">
            <Link
              href={`/historico/${sessionId}`}
              className="font-headline font-bold text-[11px] tracking-[0.1em] uppercase underline underline-offset-4"
              style={{ color: 'var(--color-ink)', opacity: 0.4 }}
            >
              Arquivo →
            </Link>
            <button
              onClick={onDismiss}
              className="font-headline font-black italic text-[13px] tracking-[0.08em] uppercase px-[22px] py-[11px]"
              style={{
                background: 'var(--color-accent)',
                color: 'var(--color-accent-ink)',
                boxShadow: 'var(--btn-shadow)',
              }}
            >
              Continuar →
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
