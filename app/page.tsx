'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Header } from '@/components/header'
import { FilterBar } from '@/components/filter-bar'
import { OfertasGrid } from '@/components/ofertas-grid'
import { MonitoredDrawer } from '@/components/monitored-drawer'
import { CopyToast } from '@/components/copy-toast'
import { fetchOfertas } from '@/lib/api'
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
  const [ofertas, setOfertas] = useState<Oferta[]>([])
  const [categoria, setCategoria] = useState<Categoria>('Todos')
  const [precoRange, setPrecoRange] = useState<[number, number]>([PRECO_MIN, PRECO_MAX])
  const [apenasDesconto, setApenasDesconto] = useState(false)
  const [termos, setTermos] = useState<string[]>(TERMOS_INICIAIS)
  const [isLoading, setIsLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [toastTrigger, setToastTrigger] = useState(0)
  const [tema, setTema] = useState<'dark' | 'light'>('dark')

  // Sync theme preference from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme') as 'dark' | 'light' | null
      if (saved === 'light' || saved === 'dark') setTema(saved)
    } catch (_) { /* no localStorage in some envs */ }
  }, [])

  const handleToggleTema = useCallback(() => {
    const next = tema === 'dark' ? 'light' : 'dark'
    setTema(next)
    document.documentElement.setAttribute('data-theme', next)
    try { localStorage.setItem('theme', next) } catch (_) { /* ignore */ }
  }, [tema])

  const ofertasFiltradas = useMemo(() => {
    return ofertas.filter((o) => {
      if (categoria !== 'Todos' && o.categoria !== categoria) return false
      if (o.preco < precoRange[0] || o.preco > precoRange[1]) return false
      if (apenasDesconto && !o.desconto_pct) return false
      return true
    })
  }, [ofertas, categoria, precoRange, apenasDesconto])

  const handleAtualizar = useCallback(async () => {
    setIsLoading(true)
    setErro(null)
    try {
      const dados = await fetchOfertas()
      setOfertas(dados)
    } catch (e) {
      setErro('Não foi possível carregar as ofertas. Tente novamente.')
      console.error('[v0] fetchOfertas error:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Busca inicial ao montar
  useEffect(() => {
    handleAtualizar()
  }, [handleAtualizar])

  const handleCopiar = useCallback((oferta: Oferta) => {
    const msg = montarMensagem(oferta)
    navigator.clipboard.writeText(msg).catch(() => {
      const el = document.createElement('textarea')
      el.value = msg
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    })
    setToastTrigger((k) => k + 1)
  }, [])

  const handleSalvarTermos = useCallback((novosTermos: string[]) => {
    setTermos(novosTermos)
    handleAtualizar()
  }, [handleAtualizar])

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Header
        onAtualizar={handleAtualizar}
        isLoading={isLoading}
        tema={tema}
        onToggleTema={handleToggleTema}
      />

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

      {/* Error banner */}
      {erro && (
        <div className="mx-6 mt-4 px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(255,59,48,0.12)', color: '#FF3B30', border: '1px solid rgba(255,59,48,0.25)' }}>
          {erro}
        </div>
      )}

      {/* Results count */}
      <div className="px-6 pt-5 pb-1">
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {isLoading ? 'Carregando ofertas...' : `${ofertasFiltradas.length} ${ofertasFiltradas.length === 1 ? 'oferta encontrada' : 'ofertas encontradas'}`}
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
