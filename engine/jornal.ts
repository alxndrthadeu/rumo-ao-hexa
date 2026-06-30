import type { MatchRecord, ResultadoPartida } from './types'
import { advanceSeed, seedToFloat } from './rng'

// ─── Manchetes por flag + resultado ──────────────────────────────────────────

type MancheteRule = {
  flags: string[]
  resultado?: ResultadoPartida
  fase?: string
  opcoes: Array<{ manchete: string; corpo: string }>
}

const REGRAS: MancheteRule[] = [
  // VITÓRIA — heroi
  { flags: ['heroi'], resultado: 'vitoria', opcoes: [
    { manchete: 'IMPOSSÍVEL. ELE FEZ O IMPOSSÍVEL.',          corpo: 'No momento certo, o homem certo. Puro talento quando o país mais precisava.' },
    { manchete: 'O HERÓI QUE O BRASIL ESPERAVA.',             corpo: 'Quando tudo parecia perdido, ele apareceu. É para isso que craques existem.' },
    { manchete: 'LENDA. SIMPLESMENTE LENDA.',                 corpo: 'Gols que entram pra história não se explicam — só se vivem.' },
    { manchete: 'O MOMENTO ERA GRANDE. ELE FOI MAIOR.',       corpo: 'Não piscou, não hesitou. Resolveu. O Brasil respirou junto com ele.' },
  ]},

  // VITÓRIA — lider
  { flags: ['lider'], resultado: 'vitoria', opcoes: [
    { manchete: 'O CAPITÃO. O BRASIL INTEIRO.',               corpo: 'Liderou com a palavra, com o exemplo. O vestiário seguiu, o resultado veio.' },
    { manchete: 'QUANDO O TIME PRECISOU, ELE ESTAVA LÁ.',     corpo: 'Não foi o mais vistoso. Foi o mais necessário. Isso é liderança de verdade.' },
    { manchete: 'COM ELE, O BRASIL ACREDITA.',                corpo: 'Cada jogada sua diz ao time: pode. Essa energia contagia.' },
    { manchete: 'LIDERANÇA SE PROVA NA PRESSÃO.',             corpo: 'Quando o jogo complicou, ele acendeu o grupo. Vestiário unido, resultado diferente.' },
  ]},

  // VITÓRIA — showman
  { flags: ['showman'], resultado: 'vitoria', opcoes: [
    { manchete: 'ESPETÁCULO PURO. ISSO É COPA DO MUNDO.',     corpo: 'Não veio só vencer. Veio mostrar. E mostrou o que poucos conseguem: arte com resultado.' },
    { manchete: 'SHOW DENTRO E FORA DE CAMPO.',               corpo: 'A imprensa internacional já pergunta o nome. O Brasil já sabe.' },
    { manchete: 'CENA QUE A COPA VAI LEMBRAR.',               corpo: 'Havia futebol sendo jogado. E havia ele. A diferença ficou registrada.' },
  ]},

  // VITÓRIA — ousado
  { flags: ['ousado'], resultado: 'vitoria', opcoes: [
    { manchete: 'OUSOU. ACERTOU. PASSOU.',                    corpo: 'Poderia ter esperado. Preferiu decidir. A coragem virou placar.' },
    { manchete: 'AUDÁCIA QUE VALE OURO.',                     corpo: 'O técnico se mordeu quando viu. O resultado? Deu razão ao ousado.' },
    { manchete: 'QUEM ARRISCA, VENCE. ELE SABIA.',            corpo: 'A jogada parecia loucura. Funcionou. No futebol, os ousados escrevem a história.' },
  ]},

  // VITÓRIA — raca
  { flags: ['raca'], resultado: 'vitoria', opcoes: [
    { manchete: 'NA RAÇA. NA DOR. E NA GLÓRIA.',              corpo: 'Ninguém disse que seria bonito. Mas foi eficiente. Isso basta numa Copa.' },
    { manchete: 'O BRASIL NÃO PARA. NUNCA PARA.',             corpo: 'Quando as pernas pesaram, a raça falou mais alto. Vitória merecida.' },
    { manchete: 'SANGUE, SUOR E TRÊS PONTOS.',                corpo: 'A entrega foi total. Cada centímetro do campo, cada segundo do jogo.' },
  ]},

  // VITÓRIA — disciplinado
  { flags: ['disciplinado'], resultado: 'vitoria', opcoes: [
    { manchete: 'TRABALHO, SILÊNCIO E RESULTADO.',            corpo: 'Sem discurso, sem polêmica. Só dedicação. Às vezes o mais chato é o mais eficaz.' },
    { manchete: 'MÉTODO. ESSA É A DIFERENÇA.',                corpo: 'Enquanto outros improvisavam, ele executou o plano. Copa é para jogadores assim.' },
    { manchete: 'NÃO FOI INSPIRAÇÃO. FOI PREPARAÇÃO.',        corpo: 'Cada hora de treino virou centímetros em campo. O resultado não foi acidente.' },
  ]},

  // VITÓRIA — coletivo
  { flags: ['coletivo'], resultado: 'vitoria', opcoes: [
    { manchete: 'BRASIL: O TIME QUE VENCEU JUNTO.',           corpo: 'Não foi um só herói desta vez. O grupo se tornou maior que qualquer indivíduo.' },
    { manchete: 'FUTEBOL DE EQUIPE. ISSO É RARO.',            corpo: 'Cada jogador no lugar certo. Um coletivo que funciona como relógio.' },
    { manchete: 'QUANDO O TIME É O CRAQUE.',                  corpo: 'Nenhum nome dominou as estatísticas. Todos contribuíram. Isso é mais difícil do que parece.' },
  ]},

  // VITÓRIA — frieza
  { flags: ['frieza'], resultado: 'vitoria', opcoes: [
    { manchete: 'GELO. ABSOLUTO GELO.',                       corpo: 'Pressão? Qual pressão? Entrou no jogo e executou como se fossem treinos.' },
    { manchete: 'CABEÇA FRIA, RESULTADO QUENTE.',             corpo: 'Nem o barulho da torcida adversária tirou o foco. Impressionante.' },
    { manchete: 'CALMARIA DENTRO DO OLHO DO FURACÃO.',        corpo: 'O estádio explodia. Ele respirou. Duas vezes. Depois resolveu.' },
  ]},

  // VITÓRIA — idolo
  { flags: ['idolo'], resultado: 'vitoria', opcoes: [
    { manchete: 'O ÍDOLO FALA COM O POVO.',                   corpo: 'Não é só futebol. É conexão. O Brasil inteiro se reconhece nele em campo.' },
    { manchete: 'O ÍDOLO QUE O BRASIL MERECIA.',              corpo: 'Em campo, é referência. Fora dele, é símbolo. Esse tipo de jogador aparece uma vez por geração.' },
    { manchete: 'A TORCIDA SABE. SEMPRE SOUBE.',              corpo: 'Antes mesmo de a bola rolar, já havia alguém em que o Brasil depositava tudo. Ele correspondeu.' },
  ]},

  // DERROTA — heroi (tentou mas não bastou)
  { flags: ['heroi'], resultado: 'derrota', opcoes: [
    { manchete: 'DEU TUDO. NÃO FOI SUFICIENTE.',              corpo: 'Lutou até o apito final. Não há o que reprovar na entrega. Às vezes o futebol é injusto.' },
    { manchete: 'O ESFORÇO NÃO TEVE RECOMPENSA.',             corpo: 'Em campo, brilhou. No placar, o Brasil ficou para trás. A Copa cobra de todos.' },
  ]},

  // DERROTA — vilao
  { flags: ['vilao'], resultado: 'derrota', opcoes: [
    { manchete: 'VERGONHA. NINGUÉM QUER ASSINAR EMBAIXO.',    corpo: 'O comportamento falou mais alto que o futebol. E o resultado refletiu isso.' },
    { manchete: 'ESSE JOGO VAI DOER POR ANOS.',               corpo: 'Não é sobre o placar. É sobre o que aconteceu dentro de campo. Inaceitável.' },
    { manchete: 'COPA DO MUNDO NÃO PERDOA.',                  corpo: 'Dentro do campo, o Brasil foi seu próprio inimigo. E o adversário aproveitou cada brecha.' },
  ]},

  // DERROTA — covarde
  { flags: ['covarde'], resultado: 'derrota', opcoes: [
    { manchete: 'FOI COM MEDO. VOLTOU SEM RESPOSTA.',         corpo: 'Recuou quando devia avançar. A timidez custou caro nessa Copa.' },
    { manchete: 'O MOMENTO PEDIU CORAGEM. ELA NÃO VEIO.',     corpo: 'Copa do Mundo não perdoa quem hesita. Ele hesitou.' },
    { manchete: 'FUTEBOL COBROU O QUE FALTOU.',               corpo: 'A Copa exige mais do que talento. Exige disposição. E ela faltou no momento decisivo.' },
  ]},

  // DERROTA — pavio_curto
  { flags: ['pavio_curto'], resultado: 'derrota', opcoes: [
    { manchete: 'A CABEÇA QUENTE CUSTOU O JOGO.',             corpo: 'Perdeu o controle em campo. A raiva foi mais forte que a razão.' },
    { manchete: 'PROVOCARAM. ELE CAIU. O BRASIL PAGOU.',      corpo: 'É uma armadilha velha. E ele caiu nela da forma mais custosa possível.' },
    { manchete: 'O TEMPERAMENTO FEZ O QUE O ADVERSÁRIO NÃO CONSEGUIU.', corpo: 'Emocional fora de controle num jogo que exigia serenidade. A conta chegou cedo.' },
  ]},

  // DERROTA — problematico
  { flags: ['problematico'], resultado: 'derrota', opcoes: [
    { manchete: 'MAIS UMA BAGUNÇA. BRASIL PAGA A CONTA.',     corpo: 'Confusão dentro e fora de campo. O grupo ressentiu, o placar confirmou.' },
    { manchete: 'DRAMA ANTES DO APITO. DERROTA DEPOIS.',      corpo: 'O que acontece fora do campo tem peso dentro. Essa é a lição.' },
    { manchete: 'VESTIÁRIO PARTIDO. RESULTADO PARTIDO.',       corpo: 'Quando o grupo não está unido, o campo enxerga. E o adversário também.' },
  ]},

  // DERROTA — afobado
  { flags: ['afobado'], resultado: 'derrota', opcoes: [
    { manchete: 'ANSIEDADE DEMAIS, TEMPO DE MENOS.',          corpo: 'Tentou tudo de uma vez. Não funcionou nada. A paciência faz falta no futebol de alto nível.' },
    { manchete: 'O PRESSA COMEU O FRANGO.',                   corpo: 'Copa não é treino. Cada decisão precipitada tem um preço.' },
    { manchete: 'ACELEROU QUANDO DEVIA RESPIRAR.',            corpo: 'O jogo pedia calma. O nervosismo pediu pressa. A pressa custou tudo.' },
  ]},

  // DERROTA — arrogante
  { flags: ['arrogante'], resultado: 'derrota', opcoes: [
    { manchete: 'EXCESSO DE CONFIANÇA. FALTA DE RESULTADO.',  corpo: 'Achou que o talento bastava. Não bastou. Humildade é parte do jogo.' },
    { manchete: 'A SOBERBA COBROU A CONTA NA HORA ERRADA.',   corpo: 'Tratou o adversário como inferior. O adversário não sabia disso. E provou.' },
    { manchete: 'COPA NÃO TEM ADVERSÁRIO FÁCIL. HOJE ELE VIU.', corpo: 'Entrou em campo com o jogo ganho na cabeça. Saiu com o resultado no peito.' },
  ]},

  // DERROTA — showman (quando o show não foi suficiente)
  { flags: ['showman'], resultado: 'derrota', opcoes: [
    { manchete: 'O SHOW NÃO BASTOU DESTA VEZ.',               corpo: 'As jogadas foram bonitas. O placar não foi. Na Copa, o que fica é o resultado.' },
    { manchete: 'ARTE SEM EFICIÊNCIA. PLACAR SEM PERDÃO.',     corpo: 'Encantou, mas não converteu. E num torneio eliminatório, encantar não classifica.' },
  ]},

  // DERROTA — ousado (a ousadia saiu pela culatra)
  { flags: ['ousado'], resultado: 'derrota', opcoes: [
    { manchete: 'ARRISCOU. NÃO FUNCIONOU. E CUSTOU CARO.',    corpo: 'A audácia é uma faca de dois gumes. Hoje o corte veio pelo lado errado.' },
    { manchete: 'A APOSTA ERA GRANDE. O PREJUÍZO TAMBÉM.',    corpo: 'Quando a ousadia acerta, é genialidade. Quando erra na Copa, é eliminação.' },
  ]},

  // EMPATE — disciplinado
  { flags: ['disciplinado'], resultado: 'empate', opcoes: [
    { manchete: 'SOUBE SEGURAR. PONTO VALIOSO.',              corpo: 'Não foi bonito, mas foi necessário. Um ponto que pode valer muito lá na frente.' },
    { manchete: 'SÓLIDO. O BRASIL SEGURA O RESULTADO.',       corpo: 'Disciplina coletiva que transforma pressão em ponto conquistado.' },
    { manchete: 'O EMPATE QUE VEM COM MÉRITO.',               corpo: 'Organizado, focado e preciso. O Brasil não cedeu, mesmo quando o adversário empurrou.' },
  ]},

  // EMPATE — frieza
  { flags: ['frieza'], resultado: 'empate', opcoes: [
    { manchete: 'FRIO E EFICIENTE. PONTO CONQUISTADO.',       corpo: 'Cabeça no lugar, perna firme. Brasil volta para casa com o que precisava.' },
    { manchete: 'SERENIDADE QUE VALE UM PONTO.',              corpo: 'Nem grito, nem desespero. O Brasil controlou o que podia controlar.' },
  ]},

  // EMPATE — pavio_curto
  { flags: ['pavio_curto'], resultado: 'empate', opcoes: [
    { manchete: 'PAVIO CURTO, RESULTADO MÉDIO.',              corpo: 'Podia ter mais. Teve menos. O temperamento limitou o que o talento poderia entregar.' },
    { manchete: 'QUASE. QUASE. MAS NÃO.',                     corpo: 'A intensidade estava lá, o controle não. Um ponto a menos do que poderia ter sido.' },
  ]},

  // EMPATE — raca
  { flags: ['raca'], resultado: 'empate', opcoes: [
    { manchete: 'NA LUTA ATÉ O APITO. PONTO ARRANCADO.',     corpo: 'Nunca desistiu. O empate chegou na base do esforço puro. Não é pouco.' },
    { manchete: 'CORAÇÃO. SÓ CORAÇÃO.',                      corpo: 'Fisicamente estava no limite. Emocionalmente, nunca parou de lutar.' },
    { manchete: 'O SUOR QUE VIROU PONTO.',                   corpo: 'Cada metro percorrido a mais fez diferença. O empate não foi dado — foi conquistado.' },
  ]},

  // EMPATE — coletivo
  { flags: ['coletivo'], resultado: 'empate', opcoes: [
    { manchete: 'JUNTOS ATÉ O FIM. O EMPATE QUE VALE.',      corpo: 'Nenhum nome brilhou sozinho. O grupo inteiro foi o resultado.' },
    { manchete: 'O TIME SEGUROU QUANDO O CRAQUE NÃO APARECEU.', corpo: 'Noite sem inspiração individual. O coletivo supriu. Um ponto justo.' },
  ]},

  // EMPATE — heroi (quase mas não)
  { flags: ['heroi'], resultado: 'empate', opcoes: [
    { manchete: 'DEU TUDO. NÃO BASTOU.',                     corpo: 'Com ele em campo, o Brasil sempre acredita. Hoje o milagre não veio, mas a entrega sim.' },
    { manchete: 'A VITÓRIA ESCAPOU POR POUCO.',              corpo: 'Quase foi o herói da noite. O gol não saiu, mas a tentativa ficará na memória.' },
  ]},

  // EMPATE — lider
  { flags: ['lider'], resultado: 'empate', opcoes: [
    { manchete: 'LIDERANÇA QUE MANTÉM O BRASIL VIVO.',       corpo: 'Com o time pressionado, ele tomou as rédeas. O ponto conquistado tem o nome dele.' },
    { manchete: 'CAPITÃO SEGURA O BARCO. PONTO SALVO.',      corpo: 'Quando o grupo balançou, a liderança equilibrou. É para isso que existe o capitão.' },
  ]},

  // PÊNALTIS — frieza
  { flags: ['frieza'], resultado: 'penaltis', opcoes: [
    { manchete: 'GELO NOS PÊNALTIS. BRASIL AVANÇA.',         corpo: 'Com a frieza de quem treinou isso a vida inteira, o Brasil converteu quando mais precisava.' },
    { manchete: 'NERVOS DE AÇO NA DISPUTA QUE GELOU O ESTÁDIO.', corpo: 'Dezesseis metros de silêncio. Ele respirou fundo, mirou e decidiu. O Brasil passou.' },
  ]},

  // PÊNALTIS — raca
  { flags: ['raca'], resultado: 'penaltis', opcoes: [
    { manchete: 'CORAGEM. GARRA. PÊNALTIS. BRASIL.',         corpo: 'Na loteria, quem estava em melhor estado mental levou a melhor. E o Brasil nunca baixou a cabeça.' },
    { manchete: 'PÊNALTIS SÃO GUERRA MENTAL. O BRASIL GANHOU.', corpo: 'Não há mais pernas na disputa de pênaltis — só cabeça. E a cabeça do Brasil estava mais forte.' },
  ]},

  // PÊNALTIS — lider
  { flags: ['lider'], resultado: 'penaltis', opcoes: [
    { manchete: 'O CAPITÃO LIDEROU ATÉ NOS PÊNALTIS.',       corpo: 'Nos momentos mais decisivos da Copa, ele esteve lá. A liderança que transforma resultados.' },
    { manchete: 'FOI O PRIMEIRO NA FILA. FOI O EXEMPLO.',     corpo: 'Quando ninguém queria ir, ele foi. É isso que faz um capitão diferente de um jogador.' },
  ]},

  // PÊNALTIS — disciplinado
  { flags: ['disciplinado'], resultado: 'penaltis', opcoes: [
    { manchete: 'MÉTODO ATÉ NA DISPUTA DE PÊNALTIS.',        corpo: 'Enquanto outros nervos falharam, a preparação falou mais alto. Pênaltis não são sorte — são treino.' },
    { manchete: 'PREPARAÇÃO QUE VALEU UMA VAGA.',            corpo: 'Repetiu o gesto mil vezes no treino. Na hora H, o músculo lembrou. O Brasil agradece.' },
  ]},

  // PÊNALTIS — heroi
  { flags: ['heroi'], resultado: 'penaltis', opcoes: [
    { manchete: 'O HERÓI DO CÍRCULO. O HERÓI DO BRASIL.',    corpo: 'Quando o jogo foi para os pênaltis, o Brasil precisava de alguém. Ele apareceu.' },
  ]},

  // ── SEMIFINAL ─────────────────────────────────────────────────────────────

  // SEMI — vitória (qualquer flag relevante)
  { fase: 'semi', resultado: 'vitoria', flags: ['heroi', 'lider', 'raca', 'frieza', 'disciplinado', 'coletivo', 'showman', 'idolo', 'ousado', 'afobado', 'vilao', 'covarde', 'pavio_curto', 'arrogante', 'boemio', 'romance', 'climao_vestiario', 'polemica', 'proposta_europa', 'cabeca_em_casa'], opcoes: [
    { manchete: 'BRASIL NA FINAL. O HEXA ESTÁ A UM PASSO.',         corpo: 'A semifinal foi superada. O Brasil entra na grande decisão com um único objetivo: o sexto título mundial.' },
    { manchete: 'UM JOGO PARA O HEXA.',                             corpo: 'A torcida pode sonhar. A copa toda foi para chegar aqui. Falta apenas uma partida.' },
    { manchete: 'SEMIFINAL VENCIDA. BRASIL MARCA A DECISÃO.',       corpo: 'A campanha segue firme. Mais um adversário superado. Agora, a maior decisão do futebol mundial.' },
    { manchete: 'FINAL! BRASIL CONFIRMA FAVORITISMO E AVANÇA.',     corpo: 'Não foi simples, mas nunca é numa semifinal de Copa. O Brasil encontrou um jeito. E está na final.' },
  ]},

  // SEMI — pênaltis
  { fase: 'semi', resultado: 'penaltis', flags: ['heroi', 'lider', 'raca', 'frieza', 'disciplinado', 'coletivo', 'showman', 'idolo', 'ousado', 'penaltis', 'afobado', 'vilao', 'covarde', 'pavio_curto', 'arrogante', 'boemio', 'romance', 'climao_vestiario', 'polemica', 'proposta_europa', 'cabeca_em_casa'], opcoes: [
    { manchete: 'NOS PÊNALTIS, O BRASIL CHEGA À FINAL.',            corpo: 'Drama máximo na semifinal. O coração do Brasil parou em cada batida. No fim, a vaga foi nossa.' },
    { manchete: 'PÊNALTIS, NERVOS, FINAL. BRASIL RESISTE.',         corpo: 'Não foi nos 90 minutos. Foi na loteria. E na loteria, quem estava mais frio foi o Brasil.' },
    { manchete: 'O BRASIL SOFREU. O BRASIL PASSOU. ESTÁ NA FINAL.', corpo: 'Não havia forma fácil de chegar a uma final de Copa. O Brasil encontrou a mais difícil — e superou.' },
  ]},

  // SEMI — derrota
  { fase: 'semi', resultado: 'derrota', flags: ['heroi', 'lider', 'raca', 'frieza', 'disciplinado', 'coletivo', 'showman', 'idolo', 'ousado', 'afobado', 'vilao', 'covarde', 'pavio_curto', 'arrogante', 'boemio', 'romance', 'climao_vestiario', 'polemica', 'proposta_europa', 'cabeca_em_casa'], opcoes: [
    { manchete: 'A FINAL FICOU PARA OUTRA VEZ.',                    corpo: 'A Copa cobrou na hora mais importante. O Brasil caiu na semifinal e o sonho do Hexa espera uma nova tentativa.' },
    { manchete: 'NA PORTA DA FINAL, O BRASIL PARA.',                corpo: 'Tão perto. Tão longe. A semifinal mostrou que o futebol não tem misericórdia.' },
  ]},

  // ── FINAL ────────────────────────────────────────────────────────────────

  // FINAL — vitória
  { fase: 'final', resultado: 'vitoria', flags: ['heroi', 'lider', 'raca', 'frieza', 'disciplinado', 'coletivo', 'showman', 'idolo', 'ousado', 'afobado', 'vilao', 'covarde', 'pavio_curto', 'arrogante', 'boemio', 'romance', 'climao_vestiario', 'polemica', 'proposta_europa', 'cabeca_em_casa'], opcoes: [
    { manchete: 'HEXA!!! O BRASIL É CAMPEÃO DO MUNDO.',             corpo: 'Era o que o Brasil esperava desde 2002. Vinte e quatro anos de espera acabaram nesta noite. O Hexa é nosso.' },
    { manchete: 'É HEXA! BRASIL CAMPEÃO DO MUNDO!',                 corpo: 'O grito que o país todo esperava ecoou pelo mundo. O Brasil voltou ao topo. Somos hexacampeões.' },
    { manchete: 'O BRASIL VOLTOU. É HEXACAMPEÃO MUNDIAL.',         corpo: 'Não importa quantos anos passem — quando o Brasil decide que vai, o mundo assiste. Hoje o mundo assistiu.' },
    { manchete: 'CAMPEÃO! O FUTEBOL VOLTOU PARA CASA.',            corpo: 'A Copa do Mundo tem um novo campeão. O mais vitorioso de todos. O Brasil é hexacampeão mundial.' },
  ]},

  // FINAL — pênaltis (vitória)
  { fase: 'final', resultado: 'penaltis', flags: ['heroi', 'lider', 'raca', 'frieza', 'disciplinado', 'coletivo', 'showman', 'idolo', 'ousado', 'penaltis', 'afobado', 'vilao', 'covarde', 'pavio_curto', 'arrogante', 'boemio', 'romance', 'climao_vestiario', 'polemica', 'proposta_europa', 'cabeca_em_casa'], opcoes: [
    { manchete: 'NOS PÊNALTIS, O HEXA. BRASIL CAMPEÃO DO MUNDO.',  corpo: 'Não foi nos 90 minutos. Não foi na prorrogação. Foi na alma. E a alma do Brasil foi mais forte.' },
    { manchete: 'PÊNALTIS NA FINAL. HEXA NO CORAÇÃO.',             corpo: 'A Copa mais emocionante terminou da forma mais dramática possível. E o troféu ficou com o Brasil.' },
  ]},

  // FINAL — derrota
  { fase: 'final', resultado: 'derrota', flags: ['heroi', 'lider', 'raca', 'frieza', 'disciplinado', 'coletivo', 'showman', 'idolo', 'ousado', 'afobado', 'vilao', 'covarde', 'pavio_curto', 'arrogante', 'boemio', 'romance', 'climao_vestiario', 'polemica', 'proposta_europa', 'cabeca_em_casa'], opcoes: [
    { manchete: 'NA FINAL, O HEXA ESCAPA.',                        corpo: 'O Brasil chegou até o último jogo. Mas o troféu não veio. A dor é grande — o respeito também.' },
    { manchete: 'VICE-CAMPEÃO. A DOR DA DECISÃO PERDIDA.',         corpo: 'Chegar à final é conquista. Perder é devastação. O Brasil sentiu os dois em uma única noite.' },
  ]},
]

function match(flags: string[], rule: MancheteRule): boolean {
  return rule.flags.some(f => flags.includes(f))
}

export function generateManchete(
  resultado: ResultadoPartida,
  flags: string[],
  adversario: string,
  seed: number,
  fase?: string
): { manchete: string; corpo: string; seed: number } {
  let s = seed
  const allMatching = REGRAS.filter(rule => {
    if (rule.resultado && rule.resultado !== resultado) return false
    if (rule.fase && rule.fase !== fase) return false
    return match(flags, rule)
  })
  // Prioriza regras com fase específica; fallback para regras genéricas
  const faseSpecific = allMatching.filter(r => r.fase === fase)
  const matching = faseSpecific.length > 0 ? faseSpecific : allMatching.filter(r => !r.fase)

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
        { manchete: `BRASIL VENCE ${adversarioUpper}. A COPA CONTINUA.`,   corpo: 'Vitória sem drama. O Brasil fez o que tinha que fazer e segue na competição.' },
        { manchete: `MISSÃO CUMPRIDA. BRASIL PASSA ${adversarioUpper}.`,   corpo: 'Eficiência quando importa. O Brasil não precisou de muito pra conseguir o que precisava.' },
        { manchete: `TRÊS PONTOS E PARA FRENTE.`,                          corpo: 'Não foi perfeito. Raramente é. Mas o que importa está no placar: vitória brasileira.' },
        { manchete: `BRASIL É BRASIL. ${adversarioUpper} É HISTÓRIA.`,     corpo: 'A Copa tem dessas noites. Noites em que o Brasil simplesmente decide que vai ganhar. E ganha.' },
      ]
      s = advanceSeed(s)
      const f = fallbacks[Math.floor(seedToFloat(s) * fallbacks.length)]
      manchete = f.manchete
      corpo = f.corpo
    } else if (resultado === 'derrota') {
      const fallbacks = [
        { manchete: `DERROTA AMARGA. ${adversarioUpper} PARA O BRASIL.`,   corpo: 'Uma noite difícil. O Brasil cai, mas a lição fica. A Copa é implacável.' },
        { manchete: `${adversarioUpper} FOI MELHOR. E MOSTROU.`,           corpo: 'Não teve desculpa. O adversário foi superior e a derrota é justa.' },
        { manchete: 'A COPA COBROU O QUE O BRASIL NÃO TEVE.',              corpo: 'Há noites em que o futebol simplesmente acontece contra você. Essa foi uma delas.' },
        { manchete: `${adversarioUpper} FECHA A PORTA. BRASIL CAI.`,       corpo: 'O adversário foi mais consistente, mais organizado e mais eficiente. O placar é justo.' },
      ]
      s = advanceSeed(s)
      const f = fallbacks[Math.floor(seedToFloat(s) * fallbacks.length)]
      manchete = f.manchete
      corpo = f.corpo
    } else if (resultado === 'penaltis') {
      const fallbacks = [
        { manchete: 'BRASIL NAS PENALIDADES. DRAMA PURO.',                 corpo: 'Não foi nos 90 minutos. Foi no coração. E o coração do Brasil resistiu.' },
        { manchete: 'PÊNALTIS. NERVOS. CLASSIFICAÇÃO.',                    corpo: 'Segundos eternos. Chutes decisivos. O Brasil saiu vivo e segue na Copa.' },
        { manchete: 'A SORTE SORRIU PARA O BRASIL.',                       corpo: 'Ninguém sai ileso de uma disputa de pênaltis. O Brasil saiu — e avança.' },
        { manchete: 'NOS PÊNALTIS, O BRASIL ENCONTROU UM JEITO.',         corpo: 'Não tinha como prever. Nunca tem. O Brasil respirou fundo, foi na fé e passou.' },
      ]
      s = advanceSeed(s)
      const f = fallbacks[Math.floor(seedToFloat(s) * fallbacks.length)]
      manchete = f.manchete
      corpo = f.corpo
    } else {
      const fallbacks = [
        { manchete: 'EMPATE. UM PASSO DE CADA VEZ.',                       corpo: 'Nenhum dos dois foi melhor. O Brasil segura o ponto e mantém a campanha viva.' },
        { manchete: 'UM PONTO. UMA LIÇÃO.',                                corpo: 'Não foi o que se queria, mas foi o que se conseguiu. A Copa não espera.' },
        { manchete: `BRASIL E ${adversarioUpper} DIVIDEM OS PONTOS.`,      corpo: 'Equilíbrio em campo, equilíbrio no placar. O Brasil segue em busca da classificação.' },
        { manchete: 'EMPATE QUE MANTÉM A ESPERANÇA VIVA.',                 corpo: 'Poderia ser pior. Poderia ser melhor. Por ora, o Brasil se mantém na briga.' },
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
  golsBrasil: number,
  golsAdversario: number,
  resultado: ResultadoPartida,
  flags: string[],
  seed: number
): { record: MatchRecord; seed: number } {
  const topFlags = [...flags].slice(-4) // mais recentes têm mais peso
  const { manchete, corpo, seed: newSeed } = generateManchete(resultado, topFlags, adversario, seed, fase)
  const record: MatchRecord = {
    partida,
    adversario,
    fase,
    placarDelta,
    golsBrasil,
    golsAdversario,
    resultado,
    flagsDestaque: topFlags.slice(0, 3),
    manchete,
    corpo,
  }
  return { record, seed: newSeed }
}
