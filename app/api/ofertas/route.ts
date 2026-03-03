import { NextResponse } from 'next/server'
import type { Oferta } from '@/lib/types'

const CATEGORIAS: { termo: string; categoria: Oferta['categoria'] }[] = [
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

interface MLSearchResponse {
  results: MLItem[]
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.ML_CLIENT_ID
  const clientSecret = process.env.ML_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('ML_CLIENT_ID e ML_CLIENT_SECRET não configurados')
  }

  const res = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
    // cache for 5 hours (token is valid for 6h)
    next: { revalidate: 18000 },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Falha ao obter token ML: ${err}`)
  }

  const data = await res.json()
  return data.access_token as string
}

async function buscarCategoria(
  termo: string,
  categoria: Oferta['categoria'],
  token: string,
): Promise<Oferta[]> {
  const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=10`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 }, // cache 5 min
  })

  if (!res.ok) return []

  const data: MLSearchResponse = await res.json()

  return data.results
    .filter((item) => item.original_price != null && item.original_price > item.price)
    .map((item): Oferta => {
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

export async function GET() {
  try {
    const token = await getAccessToken()

    const resultados = await Promise.all(
      CATEGORIAS.map(({ termo, categoria }) => buscarCategoria(termo, categoria, token)),
    )

    const ofertas: Oferta[] = resultados
      .flat()
      .sort((a, b) => (b.desconto_pct ?? 0) - (a.desconto_pct ?? 0))

    return NextResponse.json(ofertas)
  } catch (err) {
    console.error('[v0] Erro ao buscar ofertas ML:', err)
    return NextResponse.json({ error: 'Falha ao buscar ofertas' }, { status: 500 })
  }
}
