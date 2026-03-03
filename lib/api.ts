import type { Oferta } from '@/lib/types'

export async function fetchOfertas(): Promise<Oferta[]> {
  const res = await fetch('/api/ofertas')

  if (!res.ok) {
    throw new Error('Falha ao buscar ofertas')
  }

  const data: Oferta[] = await res.json()
  return data
}
