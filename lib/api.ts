import type { Oferta } from '@/lib/types'
import { MOCK_OFERTAS } from '@/lib/mock-data'

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
  expires_in: number
}

// Cache em memória do access token
let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  const now = Date.now()

  if (cachedToken && now < cachedToken.expiresAt) {
    return cachedToken.token
  }

  const clientId = process.env.ML_CLIENT_ID
  const clientSecret = process.env.ML_CLIENT_SECRET
  const refreshToken = process.env.ML_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('ML_CLIENT_ID, ML_CLIENT_SECRET e ML_REFRESH_TOKEN são obrigatórios')
  }

  const res = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
    cache: 'no-store',
  })

  const tokenBody = await res.text()
  console.log('[v0] ML token status:', res.status, 'body:', tokenBody.slice(0, 300))

  if (!res.ok) {
    throw new Error(`Falha ao renovar token ML: ${res.status} ${tokenBody}`)
  }

  const data: MLTokenResponse = JSON.parse(tokenBody)
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

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    console.warn(`[v0] Busca "${termo}": ${res.status} | ${errBody.slice(0, 200)}`)
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

/**
 * Busca ofertas diretamente no servidor (sem HTTP intermediário).
 * Usa mock data como fallback se as variáveis de ambiente não estiverem configuradas.
 */
export async function getOfertas(): Promise<Oferta[]> {
  const clientId = process.env.ML_CLIENT_ID
  const clientSecret = process.env.ML_CLIENT_SECRET
  const refreshToken = process.env.ML_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn('[v0] Variáveis ML não configuradas — usando mock data')
    return MOCK_OFERTAS
  }

  try {
    const token = await getAccessToken()

    const resultados = await Promise.allSettled(
      CATEGORIAS.map(({ termo, categoria }) => buscarCategoria(termo, categoria, token)),
    )

    const ofertas = resultados
      .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
      .sort((a, b) => (b.desconto_pct ?? 0) - (a.desconto_pct ?? 0))

    if (ofertas.length === 0) {
      console.warn('[v0] ML retornou 0 resultados — usando mock data')
      return MOCK_OFERTAS
    }

    return ofertas
  } catch (error) {
    console.error('[v0] Erro ao buscar ML:', error)
    return MOCK_OFERTAS
  }
}
