import type { MatchRecord, ResultadoPartida } from './types'
import { advanceSeed, seedToFloat } from './rng'

// ─── Manchetes por flag + resultado ──────────────────────────────────────────

type MancheteRule = {
  flags: string[]
  resultado?: ResultadoPartida
  opcoes: Array<{ manchete: string; corpo: string }>
}

const REGRAS: MancheteRule[] = [
  // VITÓRIA — heroi
  { flags: ['heroi'], resultado: 'vitoria', opcoes: [
    { manchete: 'IMPOSSÍVEL. ELE FEZ O IMPOSSÍVEL.',        corpo: 'No momento certo, o homem certo. Puro talento quando o país mais precisava.' },
    { manchete: 'O HERÓI QUE O BRASIL ESPERAVA.',           corpo: 'Quando tudo parecia perdido, ele apareceu. É para isso que craques existem.' },
    { manchete: 'LENDA. SIMPLESMENTE LENDA.',               corpo: 'Gols que entram pra história não se explicam — só se vivem.' },
  ]},

  // VITÓRIA — lider
  { flags: ['lider'], resultado: 'vitoria', opcoes: [
    { manchete: 'O CAPITÃO. O BRASIL INTEIRO.',             corpo: 'Liderou com a palavra, com o exemplo. O vestiário seguiu, o resultado veio.' },
    { manchete: 'QUANDO O TIME PRECISOU, ELE ESTAVA LÁ.',   corpo: 'Não foi o mais vistoso. Foi o mais necessário. Isso é liderança de verdade.' },
    { manchete: 'COM ELE, O BRASIL ACREDITA.',              corpo: 'Cada jogada sua diz ao time: pode. Essa energia contagia.' },
  ]},

  // VITÓRIA — showman
  { flags: ['showman'], resultado: 'vitoria', opcoes: [
    { manchete: 'ESPETÁCULO PURO. ISSO É COPA DO MUNDO.',   corpo: 'Não veio só vencer. Veio mostrar. E mostrou o que poucos conseguem: arte com resultado.' },
    { manchete: 'SHOW DENTRO E FORA DE CAMPO.',             corpo: 'A imprensa internacional já pergunta o nome. O Brasil já sabe.' },
  ]},

  // VITÓRIA — ousado
  { flags: ['ousado'], resultado: 'vitoria', opcoes: [
    { manchete: 'OUSOU. ACERTOU. PASSOU.',                  corpo: 'Poderia ter esperado. Preferiu decidir. A coragem virou placar.' },
    { manchete: 'AUDÁCIA QUE VALE OURO.',                   corpo: 'O técnico se mordeu quando viu. O resultado? Deu razão ao ousado.' },
  ]},

  // VITÓRIA — raca
  { flags: ['raca'], resultado: 'vitoria', opcoes: [
    { manchete: 'NA RAÇA. NA DOR. E NA GLÓRIA.',            corpo: 'Ninguém disse que seria bonito. Mas foi eficiente. Isso basta numa Copa.' },
    { manchete: 'O BRASIL NÃO PARA. NUNCA PARA.',           corpo: 'Quando as pernas pesaram, a raça falou mais alto. Vitória merecida.' },
  ]},

  // VITÓRIA — disciplinado
  { flags: ['disciplinado'], resultado: 'vitoria', opcoes: [
    { manchete: 'TRABALHO, SILÊNCIO E RESULTADO.',          corpo: 'Sem discurso, sem polêmica. Só dedicação. Às vezes o mais chato é o mais eficaz.' },
    { manchete: 'MÉTODO. ESSA É A DIFERENÇA.',              corpo: 'Enquanto outros improvisavam, ele executou o plano. Copa é para jogadores assim.' },
  ]},

  // VITÓRIA — coletivo
  { flags: ['coletivo'], resultado: 'vitoria', opcoes: [
    { manchete: 'BRASIL: O TIME QUE VENCEU JUNTO.',         corpo: 'Não foi um só herói desta vez. O grupo se tornou maior que qualquer indivíduo.' },
    { manchete: 'FUTEBOL DE EQUIPE. ISSO É RARO.',          corpo: 'Cada jogador no lugar certo. Um coletivo que funciona como relógio.' },
  ]},

  // VITÓRIA — frieza
  { flags: ['frieza'], resultado: 'vitoria', opcoes: [
    { manchete: 'GELO. ABSOLUTO GELO.',                     corpo: 'Pressão? Qual pressão? Entrou no jogo e executou como se fossem treinos.' },
    { manchete: 'CABEÇA FRIA, RESULTADO QUENTE.',           corpo: 'Nem o barulho da torcida adversária tirou o foco. Impressionante.' },
  ]},

  // VITÓRIA — idolo
  { flags: ['idolo'], resultado: 'vitoria', opcoes: [
    { manchete: 'O ÍDOLO FALA COM O POVO.',                 corpo: 'Não é só futebol. É conexão. O Brasil inteiro se reconhece nele em campo.' },
  ]},

  // DERROTA — vilao
  { flags: ['vilao'], resultado: 'derrota', opcoes: [
    { manchete: 'VERGONHA. NINGUÉM QUER ASSINAR EMBAIXO.',  corpo: 'O comportamento falou mais alto que o futebol. E o resultado refletiu isso.' },
    { manchete: 'ESSE JOGO VAI DOER POR ANOS.',             corpo: 'Não é sobre o placar. É sobre o que aconteceu dentro de campo. Inaceitável.' },
  ]},

  // DERROTA — covarde
  { flags: ['covarde'], resultado: 'derrota', opcoes: [
    { manchete: 'FOI COM MEDO. VOLTOU SEM RESPOSTA.',       corpo: 'Recuou quando devia avançar. A timidez custou caro nessa Copa.' },
    { manchete: 'O MOMENTO PEDIU CORAGEM. ELA NÃO VEIO.',   corpo: 'Copa do Mundo não perdoa quem hesita. Ele hesitou.' },
  ]},

  // DERROTA — pavio_curto
  { flags: ['pavio_curto'], resultado: 'derrota', opcoes: [
    { manchete: 'A CABEÇA QUENTE CUSTOU O JOGO.',           corpo: 'Perdeu o controle em campo. A raiva foi mais forte que a razão.' },
    { manchete: 'PROVOCARAM. ELE CAIU. O BRASIL PAGOU.',    corpo: 'É uma armadilha velha. E ele caiu nela da forma mais custosa possível.' },
  ]},

  // DERROTA — problematico
  { flags: ['problematico'], resultado: 'derrota', opcoes: [
    { manchete: 'MAIS UMA BAGUNÇA. BRASIL PAGA A CONTA.',   corpo: 'Confusão dentro e fora de campo. O grupo ressentiu, o placar confirmou.' },
    { manchete: 'DRAMA ANTES DO APITO. DERROTA DEPOIS.',    corpo: 'O que acontece fora do campo tem peso dentro. Essa é a lição.' },
  ]},

  // DERROTA — afobado
  { flags: ['afobado'], resultado: 'derrota', opcoes: [
    { manchete: 'ANSIEDADE DEMAIS, TEMPO DE MENOS.',        corpo: 'Tentou tudo de uma vez. Não funcionou nada. A paciência faz falta no futebol de alto nível.' },
    { manchete: 'O PRESSA COMEU O FRANGO.',                 corpo: 'Copa não é treino. Cada decisão precipitada tem um preço.' },
  ]},

  // DERROTA — arrogante
  { flags: ['arrogante'], resultado: 'derrota', opcoes: [
    { manchete: 'EXCESSO DE CONFIANÇA. FALTA DE RESULTADO.', corpo: 'Achou que o talento bastava. Não bastou. Humildade é parte do jogo.' },
  ]},

  // EMPATE — disciplinado
  { flags: ['disciplinado'], resultado: 'empate', opcoes: [
    { manchete: 'SOUBE SEGURAR. PONTO VALIOSO.',            corpo: 'Não foi bonito, mas foi necessário. Um ponto que pode valer muito lá na frente.' },
    { manchete: 'SÓLIDO. O BRASIL SEGURA O RESULTADO.',     corpo: 'Disciplina coletiva que transforma pressão em ponto conquistado.' },
  ]},

  // EMPATE — frieza
  { flags: ['frieza'], resultado: 'empate', opcoes: [
    { manchete: 'FRIO E EFICIENTE. PONTO CONQUISTADO.',     corpo: 'Cabeça no lugar, perna firme. Brasil volta para casa com o que precisava.' },
  ]},

  // EMPATE — pavio_curto
  { flags: ['pavio_curto'], resultado: 'empate', opcoes: [
    { manchete: 'PAVIO CURTO, RESULTADO MÉDIO.',            corpo: 'Podia ter mais. Teve menos. O temperamento limitou o que o talento poderia entregar.' },
  ]},

  // EMPATE — raca
  { flags: ['raca'], resultado: 'empate', opcoes: [
    { manchete: 'NA LUTA ATÉ O APITO. PONTO ARRANCADO.',   corpo: 'Nunca desistiu. O empate chegou na base do esforço puro. Não é pouco.' },
    { manchete: 'CORAÇÃO. SÓ CORAÇÃO.',                    corpo: 'Fisicamente estava no limite. Emocionalmente, nunca parou de lutar.' },
  ]},

  // EMPATE — coletivo
  { flags: ['coletivo'], resultado: 'empate', opcoes: [
    { manchete: 'JUNTOS ATÉ O FIM. O EMPATE QUE VALE.',    corpo: 'Nenhum nome brilhou sozinho. O grupo inteiro foi o resultado.' },
  ]},

  // EMPATE — heroi (tabelou mas não converteu)
  { flags: ['heroi'], resultado: 'empate', opcoes: [
    { manchete: 'DEU TUDO. NÃO BASTOU.',                   corpo: 'Com ele em campo, o Brasil sempre acredita. Hoje o milagre não veio, mas a entrega sim.' },
  ]},
]

function match(flags: string[], rule: MancheteRule): boolean {
  return rule.flags.some(f => flags.includes(f))
}

export function generateManchete(
  resultado: ResultadoPartida,
  flags: string[],
  adversario: string,
  seed: number
): { manchete: string; corpo: string; seed: number } {
  let s = seed
  const matching = REGRAS.filter(rule => {
    if (rule.resultado && rule.resultado !== resultado) return false
    return match(flags, rule)
  })

  let manchete: string
  let corpo: string

  if (matching.length > 0) {
    s = advanceSeed(s)
    const rule = matching[Math.floor(seedToFloat(s) * matching.length)]
    s = advanceSeed(s)
    const opcao = rule.opcoes[Math.floor(seedToFloat(s) * rule.opcoes.length)]
    manchete = opcao.manchete
    corpo = opcao.corpo
  } else {
    // Fallback por resultado
    const adversarioUpper = adversario.toUpperCase()
    if (resultado === 'vitoria') {
      const fallbacks = [
        { manchete: `BRASIL VENCE ${adversarioUpper}. A COPA CONTINUA.`, corpo: 'Vitória sem drama. O Brasil fez o que tinha que fazer e segue na competição.' },
        { manchete: `MISSÃO CUMPRIDA. BRASIL PASSA ${adversarioUpper}.`, corpo: 'Eficiência quando importa. O Brasil não precisou de muito pra conseguir o que precisava.' },
      ]
      s = advanceSeed(s)
      const f = fallbacks[Math.floor(seedToFloat(s) * fallbacks.length)]
      manchete = f.manchete
      corpo = f.corpo
    } else if (resultado === 'derrota') {
      const fallbacks = [
        { manchete: `DERROTA AMARGA. ${adversarioUpper} PARA O BRASIL.`, corpo: 'Uma noite difícil. O Brasil cai, mas a lição fica. A Copa é implacável.' },
        { manchete: `${adversarioUpper} FOI MELHOR. E MOSTROU.`,         corpo: 'Não teve desculpa. O adversário foi superior e a derrota é justa.' },
      ]
      s = advanceSeed(s)
      const f = fallbacks[Math.floor(seedToFloat(s) * fallbacks.length)]
      manchete = f.manchete
      corpo = f.corpo
    } else {
      const fallbacks = [
        { manchete: 'EMPATE. UM PASSO DE CADA VEZ.',       corpo: 'Nenhum dos dois foi melhor. O Brasil segura o ponto e mantém a campanha viva.' },
        { manchete: 'UM PONTO. UMA LIÇÃO.',                corpo: 'Não foi o que se queria, mas foi o que se conseguiu. A Copa não espera.' },
      ]
      s = advanceSeed(s)
      const f = fallbacks[Math.floor(seedToFloat(s) * fallbacks.length)]
      manchete = f.manchete
      corpo = f.corpo
    }
  }

  return { manchete, corpo, seed: s }
}

export function buildMatchRecord(
  partida: number,
  adversario: string,
  fase: string,
  placarDelta: number,
  resultado: ResultadoPartida,
  flags: string[],
  seed: number
): { record: MatchRecord; seed: number } {
  const topFlags = [...flags].slice(-4) // mais recentes têm mais peso
  const { manchete, corpo, seed: newSeed } = generateManchete(resultado, topFlags, adversario, seed)
  const record: MatchRecord = {
    partida,
    adversario,
    fase,
    placarDelta,
    resultado,
    flagsDestaque: topFlags.slice(0, 3),
    manchete,
    corpo,
  }
  return { record, seed: newSeed }
}
