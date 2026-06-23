import type { MatchRecord, ResultadoPartida } from './types'

// ─── Manchetes por flag + resultado ──────────────────────────────────────────

type MancheteRule = {
  flags: string[]
  resultado?: ResultadoPartida
  manchete: string
  corpo: string
}

const REGRAS: MancheteRule[] = [
  // VITÓRIA — flags especiais
  { flags: ['heroi'],       resultado: 'vitoria',  manchete: 'IMPOSSÍVEL. ELE FEZ O IMPOSSÍVEL.',       corpo: 'No momento certo, o homem certo. Puro talento quando o país mais precisava.' },
  { flags: ['lider'],       resultado: 'vitoria',  manchete: 'O CAPITÃO. O BRASIL INTEIRO.',             corpo: 'Liderou com a palavra, com o exemplo. O vestiário seguiu, o resultado veio.' },
  { flags: ['showman'],     resultado: 'vitoria',  manchete: 'ESPETÁCULO PURO. ISSO É COPA DO MUNDO.',  corpo: 'Não veio só vencer. Veio mostrar. E mostrou o que poucos conseguem: arte com resultado.' },
  { flags: ['ousado'],      resultado: 'vitoria',  manchete: 'OUSOU. ACERTOU. PASSOU.',                 corpo: 'Poderia ter esperado. Preferiu decidir. A coragem virou placar.' },
  { flags: ['raca'],        resultado: 'vitoria',  manchete: 'NA RAÇA. NA DOR. E NA GLÓRIA.',           corpo: 'Ninguém disse que seria bonito. Mas foi eficiente. Isso basta numa Copa.' },
  { flags: ['disciplinado'], resultado: 'vitoria', manchete: 'TRABALHO, SILÊNCIO E RESULTADO.',         corpo: 'Sem discurso, sem polêmica. Só dedicação. Às vezes o mais chato é o mais eficaz.' },
  { flags: ['coletivo'],    resultado: 'vitoria',  manchete: 'BRASIL: O TIME QUE VENCEU JUNTO.',        corpo: 'Não foi um só herói desta vez. O grupo se tornou maior que qualquer indivíduo.' },
  { flags: ['frieza'],      resultado: 'vitoria',  manchete: 'GELO. ABSOLUTO GELO.',                    corpo: 'Pressão? Qual pressão? Entrou no jogo e executou como se fossem treinos.' },

  // DERROTA — flags especiais
  { flags: ['vilao'],       resultado: 'derrota',  manchete: 'VERGONHA. NINGUÉM QUER ASSINAR EMBAIXO.', corpo: 'O comportamento falou mais alto que o futebol. E o resultado refletiu isso.' },
  { flags: ['covarde'],     resultado: 'derrota',  manchete: 'FOI COM MEDO. VOLTOU SEM RESPOSTA.',      corpo: 'Recuou quando devia avançar. A timidez custou caro nessa Copa.' },
  { flags: ['pavio_curto'], resultado: 'derrota',  manchete: 'A CABEÇA QUENTE CUSTOU O JOGO.',          corpo: 'Perdeu o controle em campo. A raiva foi mais forte que a razão.' },
  { flags: ['problematico'], resultado: 'derrota', manchete: 'MAIS UMA BAGUNÇA. BRASIL PAGA A CONTA.',  corpo: 'Confusão dentro e fora de campo. O grupo ressentiu, o placar confirmou.' },
  { flags: ['afobado'],     resultado: 'derrota',  manchete: 'ANSIEDADE DEMAIS, TEMPO DE MENOS.',       corpo: 'Tentou tudo de uma vez. Não funcionou nada. A paciência faz falta no futebol de alto nível.' },

  // EMPATE — flags
  { flags: ['disciplinado'], resultado: 'empate',  manchete: 'SOUBE SEGURAR. PONTO VALIOSO.',           corpo: 'Não foi bonito, mas foi necessário. Um ponto que pode valer muito lá na frente.' },
  { flags: ['frieza'],       resultado: 'empate',  manchete: 'FRIO E EFICIENTE. PONTO CONQUISTADO.',    corpo: 'Cabeça no lugar, perna firme. Brasil volta para casa com o que precisava.' },
  { flags: ['pavio_curto'],  resultado: 'empate',  manchete: 'PAVIO CURTO, RESULTADO MÉDIO.',           corpo: 'Podia ter mais. Teve menos. O temperamento limitou o que o talento poderia entregar.' },
  { flags: ['raca'],         resultado: 'empate',  manchete: 'NA LUTA ATÉ O APITO. PONTO ARRANCADO.',  corpo: 'Nunca desistiu. O empate chegou na base do esforço puro. Não é pouco.' },
]

function match(flags: string[], rule: MancheteRule): boolean {
  return rule.flags.some(f => flags.includes(f))
}

export function generateManchete(
  resultado: ResultadoPartida,
  flags: string[],
  adversario: string
): { manchete: string; corpo: string } {
  // Verifica regras em ordem (prioridade pela posição no array)
  for (const rule of REGRAS) {
    if (rule.resultado && rule.resultado !== resultado) continue
    if (match(flags, rule)) {
      return { manchete: rule.manchete, corpo: rule.corpo }
    }
  }

  // Fallback por resultado
  const adversarioUpper = adversario.toUpperCase()
  if (resultado === 'vitoria') {
    return {
      manchete: `BRASIL VENCE ${adversarioUpper}. A COPA CONTINUA.`,
      corpo: 'Vitória sem drama. O Brasil fez o que tinha que fazer e segue na competição.',
    }
  }
  if (resultado === 'derrota') {
    return {
      manchete: `DERROTA AMARGA. ${adversarioUpper} PARA O BRASIL.`,
      corpo: 'Uma noite difícil. O Brasil cai, mas a lição fica. A Copa é implacável.',
    }
  }
  return {
    manchete: 'EMPATE. UM PASSO DE CADA VEZ.',
    corpo: 'Nenhum dos dois foi melhor. O Brasil segura o ponto e mantém a campanha viva.',
  }
}

export function buildMatchRecord(
  partida: number,
  adversario: string,
  fase: string,
  placarDelta: number,
  resultado: ResultadoPartida,
  flags: string[]
): MatchRecord {
  const topFlags = [...flags].slice(-4) // mais recentes têm mais peso
  const { manchete, corpo } = generateManchete(resultado, topFlags, adversario)
  return {
    partida,
    adversario,
    fase,
    placarDelta,
    resultado,
    flagsDestaque: topFlags.slice(0, 3),
    manchete,
    corpo,
  }
}
