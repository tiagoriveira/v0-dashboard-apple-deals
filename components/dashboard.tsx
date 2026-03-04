'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Header } from '@/components/header'
import { FilterBar } from '@/components/filter-bar'
import { OfertasGrid } from '@/components/ofertas-grid'
import { MonitoredDrawer } from '@/components/monitored-drawer'
import { CopyToast } from '@/components/copy-toast'
import type { Categoria, Oferta } from '@/lib/types'

const PRECO_MIN = 0
const PRECO_MAX = 25000

const CATEGORIAS: { termo: string; categoria: Exclude<Categoria, 'Todos'> }[] = [
  { termo: 'apple iphone', categoria: 'iPhone' },
  { termo: 'apple macbook', categoria: 'MacBook' },
  { termo: 'apple ipad', categoria: 'iPad' },
  { termo: 'apple airpods', categoria: 'AirPods' },
  { termo: 'apple watch', categoria: 'Apple Watch' },
  { termo: 'apple imac', categoria: 'iMac' },
  { termo: 'apple mac mini', categoria: 'Mac Mini' },
]

interface MLItem {
  id: string
  title: string
  price: number
  original_price: number | null
  sold_quantity: number
  permalink: string
  seller: { nickname: string }
}

function montarMensagem(oferta: Oferta): string {
  const linhas = [`🍎 *${oferta.titulo}*`]
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
  linhas.push(`🛒 Compre aqui 👇`, oferta.link, `⏰ Oferta por tempo limitado!`)
  return linhas.join('\n')
}

async function buscarCategoria(
  termo: string,
  categoria: Exclude<Categoria, 'Todos'>,
  accessToken: string,
): Promise<Oferta[]> {
  const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=10`

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!res.ok) {
    console.warn(`[dashboard] Busca "${termo}": ${res.status}`)
    return []
  }

  const data: { results: MLItem[] } = await res.json()

  return data.results.map((item): Oferta => {
    const precoOriginal = item.original_price ?? item.price
    const descontoPct =
      precoOriginal > item.price
        ? Math.round((1 - item.price / precoOriginal) * 100)
        : null
    return {
      id: item.id,
      titulo: item.title,
      categoria,
      preco: item.price,
      preco_original: precoOriginal,
      desconto_pct: descontoPct,
      vendedor: item.seller?.nickname ?? 'Vendedor',
      vendidos: item.sold_quantity ?? 0,
      link: item.permalink,
    }
  })
}

async function buscarOfertas(accessToken: string): Promise<Oferta[]> {
  const resultados = await Promise.allSettled(
    CATEGORIAS.map(({ termo, categoria }) =>
      buscarCategoria(termo, categoria, accessToken),
    ),
  )

  return resultados
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .sort((a, b) => (b.desconto_pct ?? 0) - (a.desconto_pct ?? 0))
}

export function Dashboard() {
  const [ofertas, setOfertas] = useState<Oferta[]>([])
  const [categoria, setCategoria] = useState<Categoria>('Todos')
  const [precoRange, setPrecoRange] = useState<[number, number]>([PRECO_MIN, PRECO_MAX])
  const [apenasDesconto, setApenasDesconto] = useState(false)
  const [termos, setTermos] = useState<string[]>(['iPhone 15', 'MacBook Air M2', 'AirPods Pro'])
  const [isLoading, setIsLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [toastTrigger, setToastTrigger] = useState(0)
  const [tema, setTema] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme') as 'dark' | 'light' | null
      if (saved === 'light' || saved === 'dark') setTema(saved)
    } catch (_) { }
  }, [])

  const handleToggleTema = useCallback(() => {
    const next = tema === 'dark' ? 'light' : 'dark'
    setTema(next)
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem('theme', next)
    } catch (_) { }
  }, [tema])

  const handleAtualizar = useCallback(async () => {
    setIsLoading(true)
    setErro(null)
    try {
      // 1. Pega o access_token gerado no servidor (seguro)
      const tokenRes = await fetch('/api/token')
      if (!tokenRes.ok) throw new Error('Erro ao obter token')
      const { access_token } = await tokenRes.json()

      // 2. Busca as ofertas no browser (IP residencial, sem bloqueio)
      const novasOfertas = await buscarOfertas(access_token)
      setOfertas(novasOfertas)

      if (novasOfertas.length === 0) {
        setErro('Nenhuma oferta encontrada. Tente novamente em instantes.')
      }
    } catch (e) {
      setErro('Não foi possível carregar as ofertas. Tente novamente.')
      console.error('[dashboard] erro:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Busca automática ao montar
  useEffect(() => {
    handleAtualizar()
  }, [handleAtualizar])

  const ofertasFiltradas = useMemo(() => {
    return ofertas.filter((o) => {
      if (categoria !== 'Todos' && o.categoria !== categoria) return false
      if (o.preco < precoRange[0] || o.preco > precoRange[1]) return false
      if (apenasDesconto && !o.desconto_pct) return false
      return true
    })
  }, [ofertas, categoria, precoRange, apenasDesconto])

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

  const handleSalvarTermos = useCallback(
    (novosTermos: string[]) => {
      setTermos(novosTermos)
      handleAtualizar()
    },
    [handleAtualizar],
  )

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

      {erro && (
        <div
          className="mx-6 mt-4 px-4 py-3 rounded-lg text-sm"
          style={{
            background: 'rgba(255,59,48,0.12)',
            color: '#FF3B30',
            border: '1px solid rgba(255,59,48,0.25)',
          }}
        >
          {erro}
        </div>
      )}

      <div className="px-6 pt-5 pb-1">
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {isLoading
            ? 'Carregando ofertas...'
            : `${ofertasFiltradas.length} ${ofertasFiltradas.length === 1 ? 'oferta encontrada' : 'ofertas encontradas'}`}
        </p>
      </div>

      <OfertasGrid ofertas={ofertasFiltradas} onCopiarMensagem={handleCopiar} />

      <MonitoredDrawer termos={termos} onSalvar={handleSalvarTermos} />

      <CopyToast visible={toastTrigger > 0} key={toastTrigger} />
    </main>
  )
}
