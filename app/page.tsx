'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { Header } from '@/components/header'
import { FilterBar } from '@/components/filter-bar'
import { OfertasGrid } from '@/components/ofertas-grid'
import { MonitoredDrawer } from '@/components/monitored-drawer'
import { CopyToast } from '@/components/copy-toast'
import { MOCK_OFERTAS } from '@/lib/mock-data'
import type { Categoria, Oferta } from '@/lib/types'

const PRECO_MIN = 0
const PRECO_MAX = 25000

const TERMOS_INICIAIS = [
  'iPhone 15',
  'MacBook Air M2',
  'AirPods Pro',
]

function montarMensagem(oferta: Oferta): string {
  const linhas = [
    `🍎 *${oferta.titulo}*`,
  ]
  if (oferta.preco_original && oferta.desconto_pct) {
    linhas.push(
      `🔥 De R$ ${oferta.preco_original.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por *R$ ${oferta.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`,
      `✅ ${oferta.desconto_pct}% de desconto!`,
    )
  } else {
    linhas.push(
      `💰 Por apenas *R$ ${oferta.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`,
    )
  }
  linhas.push(
    `🛒 Compre aqui 👇`,
    oferta.link,
    `⏰ Oferta por tempo limitado!`,
  )
  return linhas.join('\n')
}

export default function Home() {
  const [categoria, setCategoria] = useState<Categoria>('Todos')
  const [precoRange, setPrecoRange] = useState<[number, number]>([PRECO_MIN, PRECO_MAX])
  const [apenasDesconto, setApenasDesconto] = useState(false)
  const [termos, setTermos] = useState<string[]>(TERMOS_INICIAIS)
  const [isLoading, setIsLoading] = useState(false)
  const [toastKey, setToastKey] = useState(0)
  const toastVisible = useRef(false)
  const [toastTrigger, setToastTrigger] = useState(0)

  const ofertasFiltradas = useMemo(() => {
    return MOCK_OFERTAS.filter((o) => {
      if (categoria !== 'Todos' && o.categoria !== categoria) return false
      if (o.preco < precoRange[0] || o.preco > precoRange[1]) return false
      if (apenasDesconto && !o.desconto_pct) return false
      return true
    })
  }, [categoria, precoRange, apenasDesconto])

  const handleAtualizar = useCallback(() => {
    setIsLoading(true)
    // Simulate API refresh
    setTimeout(() => setIsLoading(false), 1200)
  }, [])

  const handleCopiar = useCallback((oferta: Oferta) => {
    const msg = montarMensagem(oferta)
    navigator.clipboard.writeText(msg).catch(() => {
      // Fallback for environments without clipboard API
      const el = document.createElement('textarea')
      el.value = msg
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    })
    // Re-trigger toast even on consecutive clicks
    setToastTrigger((k) => k + 1)
  }, [])

  const handleSalvarTermos = useCallback((novosTermos: string[]) => {
    setTermos(novosTermos)
    handleAtualizar()
  }, [handleAtualizar])

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Header onAtualizar={handleAtualizar} isLoading={isLoading} />

      <FilterBar
        categoriaAtiva={categoria}
        onCategoria={setCategoria}
        precoMin={PRECO_MIN}
        precoMax={PRECO_MAX}
        precoRange={precoRange}
        onPrecoRange={setPrecoRange}
        apenasDesconto={apenasDesconto}
        onApenasDesconto={setApenasDesconto}
      />

      {/* Results count */}
      <div className="px-6 pt-5 pb-1">
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {ofertasFiltradas.length}{' '}
          {ofertasFiltradas.length === 1 ? 'oferta encontrada' : 'ofertas encontradas'}
        </p>
      </div>

      <OfertasGrid
        ofertas={ofertasFiltradas}
        onCopiarMensagem={handleCopiar}
      />

      <MonitoredDrawer termos={termos} onSalvar={handleSalvarTermos} />

      <CopyToast visible={toastTrigger > 0} key={toastTrigger} />
    </main>
  )
}
