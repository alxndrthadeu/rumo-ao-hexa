import Link from 'next/link'

const BARRAS = [
  {
    cor: '#F5C518',
    nome: 'Torcida',
    desc: 'A arquibancada. Vai com você ou contra você. Cai demais e você joga com lenço no pescoço. Sobe demais e o ego estoura.',
    alerta: 'Mantenha entre 10 e 90.',
  },
  {
    cor: '#E63946',
    nome: 'Mídia',
    desc: 'Sua relação com a imprensa. Alta demais e qualquer deslize vira manchete. Baixa demais e a pressão te isola.',
    alerta: 'Fale o necessário. Nem mais, nem menos.',
  },
  {
    cor: '#2A9D8F',
    nome: 'Moral',
    desc: 'A cabeça. Sem confiança você trava nos acréscimos. Com moral alta, você decide partidas que não merecia ganhar.',
    alerta: 'Cabeça no lugar faz diferença no 90+\'.',
  },
  {
    cor: '#264653',
    nome: 'Físico',
    desc: 'As pernas. No terceiro jogo da fase de grupos você já vai sentir. Se chegar à final no limite, qualquer carta pode te quebrar.',
    alerta: 'Cuide do corpo desde a primeira partida.',
  },
]

const MOMENTOS = [
  { min: "15'", desc: 'Início. Você define o ritmo.' },
  { min: "45'", desc: 'Final do primeiro tempo. Intensidade sobe.' },
  { min: "60'", desc: 'Segundo tempo, cansaço começa a aparecer.' },
  { min: "88'", desc: 'Reta final. Cada escolha pesa o dobro.' },
  { min: "90+'", desc: 'Acréscimos. Alta tensão. Pode mudar tudo.' },
]

const FASES = [
  {
    tag: 'Concentração',
    cor: 'bg-azul',
    desc: 'De 2 a 4 decisões antes do apito — planejar, descansar, lidar com a imprensa. Se uma barra estiver no limite, uma Crise de Vestiário aparece primeiro e precisa ser resolvida antes de qualquer outra coisa.',
  },
  {
    tag: 'Jogo',
    cor: 'bg-vermelho',
    desc: '5 momentos dentro de campo. Suas escolhas determinam o resultado. As barras influenciam quais cartas aparecem.',
  },
  {
    tag: 'Zona Mista',
    cor: 'bg-verde',
    desc: '1 pergunta da imprensa. Dependendo da sua barra de Mídia, a mesma resposta pode soar diferente.',
  },
]

export default function ComoJogar() {
  return (
    <div className="min-h-screen bg-papel">
      {/* ── Header ── */}
      <div className="relative bg-azul px-[22px] pt-[44px] pb-[36px] overflow-hidden">
        <div
          className="absolute bg-amarelo pointer-events-none"
          style={{ top: '-10%', right: '-12%', width: '80%', height: '130%', transform: 'rotate(-12deg)', opacity: 0.12 }}
        />
        <Link
          href="/"
          className="inline-block font-headline font-bold text-[10px] tracking-[0.15em] uppercase mb-[18px]"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          ← Rumo ao Hexa
        </Link>
        <p
          className="font-headline font-black italic text-[10px] tracking-[0.2em] uppercase mb-[8px]"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          Guia do Jogador · Copa 2026
        </p>
        <h1
          className="font-headline font-black italic text-[42px] leading-[0.86] tracking-[-2px]"
          style={{ color: 'var(--color-amarelo)', textShadow: '2px 2px 0 rgba(0,0,0,0.4)' }}
        >
          Como<br />se joga
        </h1>
        <p
          className="font-headline font-bold text-[14px] mt-[10px]"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          Você não precisa conhecer Reigns.<br />Só precisa amar futebol.
        </p>
      </div>

      <div className="px-[15px]">

        {/* ── Seção 1: A situação ── */}
        <div className="pt-[32px] pb-[28px] border-b-2 border-preto/10">
          <SectionLabel numero="01" titulo="A situação" />
          <p className="text-[15px] leading-[1.55] text-preto/80 mt-[12px]">
            Você é um jogador brasileiro convocado para a Copa do Mundo de 2026. Sete partidas te separam do Hexa. Cada decisão — dentro e fora de campo — está nas suas mãos.
          </p>
          <p className="text-[15px] leading-[1.55] text-preto/80 mt-[8px]">
            Não tem menu. Não tem inventário. Não tem save. É uma run só — e se você errar feio, recomeça do zero.
          </p>
        </div>

        {/* ── Seção 2: O swipe ── */}
        <div className="pt-[28px] pb-[28px] border-b-2 border-preto/10">
          <SectionLabel numero="02" titulo="A mecânica" />
          <p className="text-[15px] leading-[1.55] text-preto/80 mt-[12px] mb-[20px]">
            Você recebe uma situação. Faz uma escolha. Simples assim.
          </p>

          {/* Mock card */}
          <div className="border-2 border-preto bg-papel" style={{ boxShadow: '4px 4px 0 #100F0D' }}>
            <div className="px-[15px] pt-[18px] pb-[14px]">
              <p className="font-headline font-bold italic text-[17px] leading-[1.3] tracking-[-0.3px] text-preto text-center">
                O treinador te tira no intervalo. Você acha que está jogando bem.
              </p>
            </div>
            <div className="border-t-2 border-preto px-[12px] py-[10px] flex items-center gap-[10px] bg-white">
              <span className="font-headline font-black italic text-[17px] text-vermelho">←</span>
              <div className="flex-1">
                <p className="text-[14px] font-medium text-preto">Aceita quieto, sem reclamar</p>
                <div className="flex gap-[4px] mt-[5px]">
                  <span className="font-headline font-bold text-[10px] px-[7px] py-[3px] bg-verde text-white">Mor +5</span>
                  <span className="font-headline font-bold text-[10px] px-[7px] py-[3px] bg-vermelho text-white">Míd -8</span>
                </div>
              </div>
            </div>
            <div className="border-t-2 border-preto px-[12px] py-[10px] flex items-center gap-[10px] bg-white">
              <div className="flex-1 text-right">
                <p className="text-[14px] font-medium text-preto">Pede explicação na frente de todo mundo</p>
                <div className="flex gap-[4px] mt-[5px] justify-end">
                  <span className="font-headline font-bold text-[10px] px-[7px] py-[3px] bg-vermelho text-white">Mor -10</span>
                  <span className="font-headline font-bold text-[10px] px-[7px] py-[3px] bg-verde text-white">Tor +12</span>
                </div>
              </div>
              <span className="font-headline font-black italic text-[17px] text-verde">→</span>
            </div>
          </div>

          <p
            className="font-headline font-bold text-[10px] tracking-[0.2em] uppercase text-center mt-[12px]"
            style={{ color: 'var(--color-preto)', opacity: 0.35 }}
          >
            ← arrasta para escolher →
          </p>

          <div className="mt-[16px] flex flex-col gap-[8px]">
            <InfoRow cor="var(--color-verde)" texto="Arrastar para a direita → escolha da direita" />
            <InfoRow cor="var(--color-vermelho)" texto="Arrastar para a esquerda → escolha da esquerda" />
            <InfoRow cor="var(--color-azul)" texto="Cada escolha muda pelo menos uma barra" />
          </div>

          <div className="mt-[20px] bg-amarelo/15 border-l-[4px] border-amarelo px-[12px] py-[10px]">
            <p className="font-headline font-black italic text-[13px] text-preto mb-[4px]">Tokens de bônus</p>
            <p className="text-[13px] leading-[1.45] text-preto/70">
              Certas escolhas concedem tokens — Ousado, Raça, Frieza, Liderança, Disciplina. Outros os consomem em troca de uma vantagem extra. Quando disponíveis, aparecem como badges coloridos na carta. Sem o token, a vantagem não acontece.
            </p>
          </div>
        </div>

        {/* ── Seção 3: As barras ── */}
        <div className="pt-[28px] pb-[28px] border-b-2 border-preto/10">
          <SectionLabel numero="03" titulo="As 4 barras" />
          <p className="text-[15px] leading-[1.55] text-preto/80 mt-[12px] mb-[20px]">
            Cada decisão afeta uma ou mais dessas barras. Se qualquer uma chegar a{' '}
            <strong>0 ou 100</strong>, fim de jogo — não importa o placar.
          </p>

          <div className="flex flex-col gap-[14px]">
            {BARRAS.map(b => (
              <div key={b.nome} className="border-l-[4px] pl-[12px] py-[2px]" style={{ borderColor: b.cor }}>
                <p className="font-headline font-black italic text-[16px] text-preto leading-none mb-[4px]">
                  {b.nome}
                </p>
                <p className="text-[13px] leading-[1.4] text-preto/70 mb-[4px]">
                  {b.desc}
                </p>
                <p
                  className="font-headline font-bold text-[11px] tracking-[0.02em]"
                  style={{ color: b.cor }}
                >
                  {b.alerta}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Seção 4: 3 fases por partida ── */}
        <div className="pt-[28px] pb-[28px] border-b-2 border-preto/10">
          <SectionLabel numero="04" titulo="3 fases por partida" />
          <p className="text-[15px] leading-[1.55] text-preto/80 mt-[12px] mb-[20px]">
            Cada jogo da Copa tem três momentos distintos.
          </p>

          <div className="flex flex-col gap-[10px]">
            {FASES.map(f => (
              <div key={f.tag} className="flex gap-[12px] items-start">
                <span
                  className={`font-headline font-black italic text-[10px] tracking-[0.1em] uppercase text-white px-[10px] py-[4px] shrink-0 mt-[1px] ${f.cor}`}
                  style={{ transform: 'skewX(-6deg)' }}
                >
                  {f.tag}
                </span>
                <p className="text-[13px] leading-[1.45] text-preto/75 flex-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Seção 5: 5 momentos do jogo ── */}
        <div className="pt-[28px] pb-[28px] border-b-2 border-preto/10">
          <SectionLabel numero="05" titulo="Os 90 minutos" />
          <p className="text-[15px] leading-[1.55] text-preto/80 mt-[12px] mb-[20px]">
            Na fase de Jogo, você decide 5 momentos reais da partida. As suas barras influenciam quais cartas aparecem.
          </p>

          <div className="relative">
            {/* linha de tempo */}
            <div className="absolute left-[21px] top-[8px] bottom-[8px] w-[2px] bg-preto/15" />
            <div className="flex flex-col gap-[14px] pl-[0px]">
              {MOMENTOS.map((m, i) => (
                <div key={m.min} className="flex items-start gap-[14px]">
                  <div
                    className="w-[44px] shrink-0 font-headline font-black italic text-[13px] text-center py-[3px] text-white"
                    style={{
                      background: i === 4 ? 'var(--color-vermelho)' : 'var(--color-preto)',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {m.min}
                  </div>
                  <p className="text-[14px] leading-[1.4] text-preto/75 pt-[3px]">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-[16px] bg-vermelho/10 border-l-[4px] border-vermelho px-[12px] py-[10px]">
            <p className="font-headline font-bold text-[12px] text-preto">
              Nos acréscimos (90+'), as cartas são diferentes e mais dramáticas. Tudo pode mudar num swipe.
            </p>
          </div>
        </div>

        {/* ── Seção 6: O objetivo ── */}
        <div className="pt-[28px] pb-[28px] border-b-2 border-preto/10">
          <SectionLabel numero="06" titulo="O objetivo" />

          <div className="mt-[16px] flex flex-col gap-[10px]">
            {[
              { jogo: 'J1 · J2 · J3', fase: 'Fase de Grupos', detalhe: 'Precisa de pontos para classificar' },
              { jogo: 'J4', fase: 'Oitavas de Final', detalhe: 'Eliminação direta a partir daqui' },
              { jogo: 'J5', fase: 'Quartas de Final', detalhe: 'Um erro e acabou' },
              { jogo: 'J6', fase: 'Semifinal', detalhe: 'Falta pouco' },
              { jogo: 'J7', fase: 'Final', detalhe: 'O Hexa depende desta partida' },
            ].map(item => (
              <div key={item.jogo} className="flex items-center gap-[12px]">
                <span className="font-headline font-black italic text-[11px] text-white bg-preto px-[8px] py-[3px] shrink-0 min-w-[64px] text-center">
                  {item.jogo}
                </span>
                <div>
                  <p className="font-headline font-bold text-[13px] text-preto leading-none">{item.fase}</p>
                  <p className="text-[11px] text-preto/50 mt-[1px]">{item.detalhe}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-[20px] bg-amarelo/20 border-2 border-amarelo px-[14px] py-[12px]">
            <p className="font-headline font-black italic text-[18px] text-preto leading-[1.1]">
              Vença a Final sem deixar nenhuma barra estourar — o Brasil é Hexacampeão.
            </p>
          </div>
        </div>

        {/* ── Dica final ── */}
        <div className="pt-[24px] pb-[4px]">
          <p className="font-headline font-black italic text-[11px] tracking-[0.05em] uppercase text-preto/40 mb-[8px]">
            Uma dica antes de começar
          </p>
          <p className="text-[14px] leading-[1.5] text-preto/70">
            Não existe escolha certa. Cada arquétipo reage diferente à mesma situação. Experimente, erre, recomece — e quando você ganhar, vai ter sido merecido.
          </p>
        </div>

      </div>

      {/* ── CTA ── */}
      <div className="px-[15px] pt-[28px] pb-[48px]">
        <Link
          href="/arquetipo"
          className="w-full text-center block font-headline font-black italic text-[22px] tracking-[0.5px] text-white py-[13px] bg-verde"
          style={{ boxShadow: '4px 4px 0 #100F0D' }}
        >
          Escolher Arquétipo →
        </Link>
        <Link
          href="/"
          className="w-full text-center block font-headline font-bold text-[13px] text-preto/40 py-[14px]"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}

function SectionLabel({ numero, titulo }: { numero: string; titulo: string }) {
  return (
    <div className="flex items-center gap-[12px]">
      <span
        className="font-headline font-black italic text-[11px] tracking-[0.08em] uppercase text-white bg-preto px-[10px] py-[4px]"
        style={{ transform: 'skewX(-8deg)' }}
      >
        {numero}
      </span>
      <h2 className="font-headline font-black italic text-[22px] tracking-[-0.5px] text-preto leading-none">
        {titulo}
      </h2>
    </div>
  )
}

function InfoRow({ cor, texto }: { cor: string; texto: string }) {
  return (
    <div className="flex items-start gap-[8px]">
      <div
        className="w-[3px] shrink-0 mt-[4px]"
        style={{ height: '14px', background: cor }}
      />
      <p className="text-[13px] text-preto/70 leading-[1.35]">{texto}</p>
    </div>
  )
}
