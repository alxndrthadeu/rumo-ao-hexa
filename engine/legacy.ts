import type { Legacy, RunState } from './types'
import { dominantCareerFlag } from './flags'

export { dominantCareerFlag }

// Fórmula placeholder — tunar no playtest
export function computeNota(state: RunState): number {
  const positiveFlags = ['humilde', 'idolo', 'lider', 'entregue']
  const negativeFlags = ['arrogante', 'mercenario', 'problematico', 'vitrine']

  let nota = 40
  nota += (state.partidaAtual - 1) * 6

  for (const [flag, count] of Object.entries(state.flagsCarreira)) {
    if (positiveFlags.includes(flag)) nota += count * 3
    if (negativeFlags.includes(flag)) nota -= count * 2
  }

  if (state.causaMorte === 'vitoria') nota += 25

  return Math.max(0, Math.min(100, Math.round(nota)))
}

export function generateLegacy(state: RunState): Legacy {
  const causa = state.causaMorte ?? 'placar'
  const flag = dominantCareerFlag(state.flagsCarreira)
  const { arquetipo } = state

  const epitafio = resolveEpitafio(causa, flag, arquetipo, state)
  const reputacao = flag !== 'nenhuma' ? flag : 'desconhecido'

  return {
    nota: computeNota(state),
    epitafio,
    causa,
    reputacao,
  }
}

function resolveEpitafio(
  causa: string,
  flag: string,
  arquetipo: string,
  state: RunState
): string {
  // Especiais por arquétipo têm prioridade
  if (arquetipo === 'caido') {
    if (causa === 'vitoria') return 'O Príncipe enfim virou Rei. Redenção que ninguém mais esperava.'
    return 'A última chance escapou. O maior talento que o Brasil não soube guardar.'
  }
  if (arquetipo === 'futuro') {
    if (causa === 'vitoria') return 'Campeão do mundo aos 18. O futuro chegou — e era ainda maior.'
    if (state.partidaAtual <= 3) return 'Aos 18, já carregou um país. A história dele mal começou.'
  }

  if (causa === 'vitoria') {
    const map: Record<string, string> = {
      humilde:    'O menino que agradeceu a todos, menos a si mesmo. Eterno e querido.',
      arrogante:  'Ergueu a taça e disse que sempre soube. Insuportável. Imortal.',
      idolo:      'Subiu com a bandeira nas costas. O povo o carregou pra sempre.',
      mercenario: 'Campeão do mundo. Assinou com a Europa na semana seguinte.',
      lider:      'Vestiu a braçadeira e levantou um país. O capitão da geração.',
      vitrine:    'Campeão, capa de todas as revistas. Jogou bola também, dizem.',
    }
    return map[flag] ?? 'Campeão do mundo. O sonho de todo moleque, realizado.'
  }

  if (causa === 'placar') {
    const map: Record<string, string> = {
      idolo:       'Saiu nos braços do povo, chorando junto com a nação. Herói sem taça.',
      mercenario:  'Eliminado. Ninguém chorou. Já tinha um pé na Europa mesmo.',
      humilde:     'Caiu de pé, pediu desculpas, prometeu voltar. E a gente acreditou.',
      arrogante:   'Eliminado prometendo títulos que nunca vieram. A nação cansou.',
      problematico:'Saiu brigado com meio elenco. Talento desperdiçado em confusão.',
    }
    return map[flag] ?? 'A Copa acabou cedo demais. Ficou o gosto amargo do "e se".'
  }

  if (causa === 'barra' && state.barraMorte) {
    const { barra, extreme } = state.barraMorte
    if (barra === 'fisico') return 'O corpo traiu o talento. Saiu de maca, no auge, sem se despedir.'
    if (barra === 'midia' && extreme === 'min') return 'Sumiu do mapa. O craque que o país esqueceu antes da hora.'
    if (barra === 'midia' && extreme === 'max') return 'Virou novela, meme, polêmica. De jogador, restou pouco.'
    if (barra === 'torcida' && extreme === 'min') return 'Vaiado até o fim. Caiu da seleção sem honras.'
    if (barra === 'torcida' && extreme === 'max') return 'A idolatria virou prisão. A pressão de ser deus o quebrou.'
    if (barra === 'moral' && extreme === 'min') return 'O vestiário fechou a porta. Jogou sozinho, perdeu sozinho.'
    if (barra === 'moral' && extreme === 'max') return 'Achou que era maior que o time. Rachou o grupo e afundou junto.'
  }

  return 'A Copa deixou uma marca. O resto é silêncio.'
}
