'use client'

import type { Oferta } from '@/lib/types'

interface OfertaCardProps {
  oferta: Oferta
  onCopiarMensagem: (oferta: Oferta) => void
}

function formatarPreco(valor: number) {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function OfertaCard({ oferta, onCopiarMensagem }: OfertaCardProps) {
  const temDesconto = oferta.desconto_pct !== null && oferta.preco_original !== null

  return (
    <article
      className="relative flex flex-col rounded-xl overflow-hidden transition-all duration-200"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-subtle)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-mid)'
        e.currentTarget.style.transform = 'scale(1.01)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)'
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      {/* Discount badge */}
      {temDesconto && (
        <div
          className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-xs font-semibold z-10"
          style={{ background: 'var(--success)', color: 'var(--success-foreground)' }}
        >
          {oferta.desconto_pct}% OFF
        </div>
      )}

      {/* Card body */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Category chip */}
        <span
          className="text-xs w-fit px-2 py-0.5 rounded-md"
          style={{
            background: 'var(--border-subtle)',
            color: 'var(--muted-foreground)',
            letterSpacing: '0.02em',
          }}
        >
          {oferta.categoria}
        </span>

        {/* Title */}
        <h3
          className="text-sm leading-snug font-medium text-pretty"
          style={{
            color: 'var(--foreground)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {oferta.titulo}
        </h3>

        {/* Pricing */}
        <div className="flex flex-col gap-0.5 mt-auto">
          <span
            className="text-2xl leading-tight"
            style={{ color: 'var(--foreground)', fontWeight: 600, letterSpacing: '-0.02em' }}
          >
            R$ {formatarPreco(oferta.preco)}
          </span>
          {temDesconto && (
            <span
              className="text-sm line-through"
              style={{ color: 'var(--muted-foreground)' }}
            >
              R$ {formatarPreco(oferta.preco_original!)}
            </span>
          )}
        </div>

        {/* Seller + sales */}
        <div className="flex items-center justify-between">
          <span className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
            {oferta.vendedor}
          </span>
          <span className="text-xs flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>
            {oferta.vendidos.toLocaleString('pt-BR')} vendidos
          </span>
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex flex-col gap-2 px-4 pb-4"
        style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}
      >
        <button
          onClick={() => onCopiarMensagem(oferta)}
          className="w-full py-2 text-sm rounded-lg font-medium transition-all duration-200 active:scale-95"
          style={{
            background: 'var(--action)',
            color: 'var(--action-foreground)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.85'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
        >
          Copiar mensagem
        </button>
        <a
          href={oferta.link}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2 text-sm rounded-lg font-medium text-center transition-all duration-200 active:scale-95 block"
          style={{
            border: '1px solid var(--border-mid)',
            color: 'var(--muted-foreground)',
            background: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--foreground)'
            e.currentTarget.style.color = 'var(--foreground)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-mid)'
            e.currentTarget.style.color = 'var(--muted-foreground)'
          }}
        >
          Ver no ML
        </a>
      </div>
    </article>
  )
}
