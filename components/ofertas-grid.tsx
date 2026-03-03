'use client'

import type { Oferta } from '@/lib/types'
import { OfertaCard } from './oferta-card'
import { SearchX } from 'lucide-react'

interface OfertasGridProps {
  ofertas: Oferta[]
  onCopiarMensagem: (oferta: Oferta) => void
}

export function OfertasGrid({ ofertas, onCopiarMensagem }: OfertasGridProps) {
  if (ofertas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <SearchX size={44} aria-hidden="true" style={{ color: 'var(--border-mid)' }} />
        <p
          className="text-base font-medium"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Nenhuma oferta encontrada
        </p>
        <p className="text-sm" style={{ color: 'var(--border-mid)' }}>
          Tente ajustar os filtros ou atualizar as ofertas
        </p>
      </div>
    )
  }

  return (
    <div
      className="grid gap-4 p-6"
      style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      }}
    >
      {ofertas.map((oferta) => (
        <OfertaCard
          key={oferta.id}
          oferta={oferta}
          onCopiarMensagem={onCopiarMensagem}
        />
      ))}
    </div>
  )
}
