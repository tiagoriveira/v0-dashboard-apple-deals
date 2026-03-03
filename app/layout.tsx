import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Apple Deals — Ofertas Mercado Livre',
  description: 'Monitoramento de ofertas de produtos Apple no Mercado Livre em tempo real.',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
