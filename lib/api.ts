import type { Oferta } from '@/lib/types'

export async function fetchOfertas(): Promise<Oferta[]> {
  const res = await fetch('/api/ofertas')

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error ?? `Erro ${res.status} ao buscar ofertas`)
  }

  const data: { ofertas: Oferta[] } = await res.json()
  return data.ofertas
}
