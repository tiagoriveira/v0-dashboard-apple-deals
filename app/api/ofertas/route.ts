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

interface MLTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

// Cache simples do token em memória (válido por ~6h)
let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  const now = Date.now()

  if (cachedToken && now < cachedToken.expiresAt) {
    return cachedToken.token
  }

  const clientId = process.env.ML_CLIENT_ID
  const clientSecret = process.env.ML_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('ML_CLIENT_ID ou ML_CLIENT_SECRET não configurados')
  }

  const res = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Falha ao obter token ML: ${res.status} ${body}`)
  }

  const data: MLTokenResponse = await res.json()

  // Expira 5 minutos antes para evitar race condition
  cachedToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in - 300) * 1000,
  }

  return cachedToken.token
}

async function buscarCategoria(
  termo: string,
  categoria: Oferta['categoria'],
  token: string,
): Promise<Oferta[]> {
  const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=10`

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 300 }, // cache de 5 minutos
    })

    if (!res.ok) {
      console.warn(`[ML API] Erro ao buscar "${termo}": ${res.status} ${res.statusText}`)
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
  } catch (error) {
    console.error(`[ML API] Erro ao buscar categoria "${termo}"`, error)
    return []
  }
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

    return NextResponse.json({ ofertas })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[API /ofertas]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
