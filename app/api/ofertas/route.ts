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
  refresh_token?: string
}

// Cache em memória do access token (válido por ~6h no ML)
let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Obtém um APP_USR access token usando o refresh_token armazenado como
 * variável de ambiente. O ML não suporta client_credentials — o único
 * fluxo server-side sem interação do usuário é refresh_token.
 *
 * Para gerar o refresh_token inicial acesse:
 * https://auth.mercadolivre.com.br/authorization?response_type=code
 *   &client_id=<ML_CLIENT_ID>&redirect_uri=<ML_REDIRECT_URI>
 * Troque o code pelo token via POST /oauth/token (authorization_code)
 * e salve o refresh_token resultante como ML_REFRESH_TOKEN.
 */
async function getAccessToken(): Promise<string> {
  const now = Date.now()

  if (cachedToken && now < cachedToken.expiresAt) {
    return cachedToken.token
  }

  const clientId = process.env.ML_CLIENT_ID
  const clientSecret = process.env.ML_CLIENT_SECRET
  const refreshToken = process.env.ML_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Variáveis ML_CLIENT_ID, ML_CLIENT_SECRET e ML_REFRESH_TOKEN são obrigatórias',
    )
  }

  console.log('[v0] Iniciando refresh_token com client_id:', clientId?.slice(0, 6) + '...')

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
  console.log('[v0] Token response status:', res.status, 'body:', tokenBody)

  if (!res.ok) {
    throw new Error(`Falha ao renovar token ML: ${res.status} ${tokenBody}`)
  }

  const data: MLTokenResponse = JSON.parse(tokenBody)

  // Expira 5 min antes para evitar race condition (ML expira em 6h = 21600s)
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
    console.warn(`[v0] Erro ao buscar "${termo}": ${res.status} ${res.statusText} | body: ${errBody.slice(0, 200)}`)
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

export async function GET() {
  try {
    const token = await getAccessToken()

    const resultados = await Promise.allSettled(
      CATEGORIAS.map(({ termo, categoria }) => buscarCategoria(termo, categoria, token)),
    )

    const ofertas: Oferta[] = resultados
      .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
      .sort((a, b) => (b.desconto_pct ?? 0) - (a.desconto_pct ?? 0))

    return NextResponse.json({ ofertas })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[API /ofertas]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
