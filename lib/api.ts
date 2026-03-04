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

async function buscarCategoria(
  termo: string,
  categoria: Oferta['categoria']
): Promise<Oferta[]> {
  const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=10`

  try {
    const res = await fetch(url)

    if (!res.ok) {
      console.warn(`[ML API] Erro ao buscar ${termo}: ${res.status} ${res.statusText}`)
      return []
    }

    const data: { results: MLItem[] } = await res.json()

    return data.results.map((item): Oferta => {
      const precoOriginal = item.original_price ?? item.price
      const descontoPct = precoOriginal > item.price
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
  } catch (error) {
    console.error(`[ML API] Erro ao buscar categoria ${termo}`, error)
    return []
  }
}

export async function fetchOfertas(): Promise<Oferta[]> {
  const resultados = await Promise.all(
    CATEGORIAS.map(({ termo, categoria }) => buscarCategoria(termo, categoria))
  )

  const ofertas: Oferta[] = resultados
    .flat()
    .sort((a, b) => (b.desconto_pct ?? 0) - (a.desconto_pct ?? 0))

  return ofertas
}
