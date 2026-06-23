import type { Metadata, Viewport } from 'next'
import { Inter, Saira, Archivo_Black } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const saira = Saira({ subsets: ['latin'], variable: '--font-saira', weight: ['400', '700', '900'], style: ['normal', 'italic'] })
const archivo = Archivo_Black({ subsets: ['latin'], variable: '--font-archivo', weight: '400' })

export const metadata: Metadata = {
  title: '26 — Rumo ao Hexa',
  description: 'Viva 7 partidas de Copa do Mundo como um craque da seleção brasileira.',
}

export const viewport: Viewport = {
  themeColor: '#FFCB05',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${saira.variable} ${archivo.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
