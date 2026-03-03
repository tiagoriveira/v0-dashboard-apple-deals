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
  thumbnail: string
}

interface MLSearchResponse {
  results: MLItem[]
}

// The ML Search API is publicly accessible using the app_id (client_id) as a
// query parameter — no OAuth user token required for read-only searches.
async function buscarCategoria(
  termo: string,
  categoria: Oferta['categoria'],
  appId: string,
): Promise<Oferta[]> {
  const url =
    `https://api.mercadolibre.com/sites/MLB/search` +
    `?q=${encodeURIComponent(termo)}&limit=20&app_id=${appId}`

  const res = await fetch(url, {
    next: { revalidate: 300 }, // cache 5 min
  })

  if (!res.ok) {
    console.error(`[v0] ML search failed for "${termo}": ${res.status} ${await res.text()}`)
    return []
  }

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
        imagem: item.thumbnail?.replace(/\bI\b/, 'O') ?? null,
      }
    })
}

export async function GET() {
  const appId = process.env.ML_CLIENT_ID

  if (!appId) {
    return NextResponse.json({ error: 'ML_CLIENT_ID não configurado' }, { status: 500 })
  }

  try {
    const resultados = await Promise.all(
      CATEGORIAS.map(({ termo, categoria }) => buscarCategoria(termo, categoria, appId)),
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
