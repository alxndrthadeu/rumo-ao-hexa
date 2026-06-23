type Props = { onContinue: () => void }

const GROUP_TABLE = [
  { pos: 1, nome: 'Brasil',   j: 3, pts: 7, me: true  },
  { pos: 2, nome: 'Marrocos', j: 3, pts: 5, me: false },
  { pos: 3, nome: 'Escócia',  j: 3, pts: 3, me: false, out: true },
  { pos: 4, nome: 'Haiti',    j: 3, pts: 1, me: false, out: true },
]

const FASES = ['Oitavas', 'Quartas', 'Semi', 'Final']

export default function GroupResult({ onContinue }: Props) {
  return (
    <div className="flex flex-col flex-1 min-h-screen bg-papel px-[15px] pt-[20px] pb-[24px]">
      {/* scr-kick */}
      <p className="font-headline font-[800] text-[9px] tracking-[2px] uppercase text-vermelho text-center mb-[2px]">
        Classificação · após o 3º jogo
      </p>

      {/* scr-title */}
      <p className="font-headline font-black italic text-[26px] tracking-[-0.5px] text-center text-preto mb-[12px]">
        Grupo C
      </p>

      {/* Tabela */}
      <table className="w-full border-collapse font-sans text-[13px] mb-0">
        <thead>
          <tr>
            <th className="font-headline font-[800] text-[9px] tracking-[1px] uppercase text-left px-[6px] py-[4px] border-b-2 border-preto"
              style={{ color: '#4B4A45' }}>
              #
            </th>
            <th className="font-headline font-[800] text-[9px] tracking-[1px] uppercase text-left px-[6px] py-[4px] border-b-2 border-preto"
              style={{ color: '#4B4A45' }}>
              Seleção
            </th>
            <th className="font-headline font-[800] text-[9px] tracking-[1px] uppercase text-left px-[6px] py-[4px] border-b-2 border-preto"
              style={{ color: '#4B4A45' }}>
              J
            </th>
            <th className="font-headline font-[800] text-[9px] tracking-[1px] uppercase text-left px-[6px] py-[4px] border-b-2 border-preto"
              style={{ color: '#4B4A45' }}>
              Pts
            </th>
          </tr>
        </thead>
        <tbody>
          {GROUP_TABLE.map(row => (
            <tr key={row.pos} style={row.me ? { background: 'var(--color-amarelo, #FFCB05)' } : undefined}>
              <td className="px-[6px] py-[8px] font-headline font-black text-azul"
                style={{ borderBottom: '1px solid #E8E6DE' }}>
                {row.pos}
              </td>
              <td
                className={`px-[6px] py-[8px] ${row.me ? 'font-bold' : ''} ${row.out ? 'text-vermelho font-bold' : ''}`}
                style={{ borderBottom: '1px solid #E8E6DE' }}
              >
                {row.nome}
              </td>
              <td className={`px-[6px] py-[8px] tabular-nums ${row.me ? 'font-bold' : ''}`}
                style={{ borderBottom: '1px solid #E8E6DE' }}>
                {row.j}
              </td>
              <td className={`px-[6px] py-[8px] tabular-nums ${row.me ? 'font-bold' : ''}`}
                style={{ borderBottom: '1px solid #E8E6DE' }}>
                {row.pts}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* mini-chart */}
      <div className="mt-[16px] border-t-2 border-preto pt-[12px]">
        <p className="font-headline font-[800] text-[9px] tracking-[2px] uppercase mb-[8px]"
          style={{ color: '#4B4A45' }}>
          O caminho até a taça
        </p>
        <div className="flex items-center gap-[5px] font-headline font-[800] text-[9.5px] tracking-[0.5px] uppercase">
          {FASES.map((fase, i) => (
            <div key={fase} className="contents">
              <span
                className={`border-2 px-[6px] py-[5px] flex-1 text-center ${i === 0 ? 'bg-verde text-white border-verde' : 'border-preto text-preto'}`}
              >
                {fase}
              </span>
              {i < FASES.length - 1 && (
                <span style={{ color: '#4B4A45' }}>→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      {/* CTA */}
      <button
        onClick={onContinue}
        className="w-full text-center bg-verde text-white font-headline font-black italic text-[22px] tracking-[0.5px] py-[13px] mt-[20px]"
        style={{ boxShadow: '4px 4px 0 #100F0D' }}
      >
        Continuar →
      </button>
    </div>
  )
}
