'use client'

import { useRef } from 'react'
import type { Categoria } from '@/lib/types'

const CATEGORIAS: Categoria[] = [
  'Todos',
  'iPhone',
  'MacBook',
  'iPad',
  'AirPods',
  'Apple Watch',
  'iMac',
  'Mac Mini',
]

interface FilterBarProps {
  categoriaAtiva: Categoria
  onCategoria: (c: Categoria) => void
  precoMin: number
  precoMax: number
  precoRange: [number, number]
  onPrecoRange: (range: [number, number]) => void
  apenasDesconto: boolean
  onApenasDesconto: (v: boolean) => void
}

export function FilterBar({
  categoriaAtiva,
  onCategoria,
  precoMin,
  precoMax,
  precoRange,
  onPrecoRange,
  apenasDesconto,
  onApenasDesconto,
}: FilterBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div
      className="sticky z-30 px-6 py-3 flex flex-col gap-3"
      style={{
        top: '65px',
        backgroundColor: 'rgba(0,0,0,0.90)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Category pills */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-0.5"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {CATEGORIAS.map((cat) => {
          const active = cat === categoriaAtiva
          return (
            <button
              key={cat}
              onClick={() => onCategoria(cat)}
              className="flex-shrink-0 px-3 py-1 text-sm rounded-full transition-all duration-200"
              style={{
                background: active ? 'var(--action)' : 'transparent',
                color: active ? '#fff' : 'var(--muted-foreground)',
                border: active ? '1px solid var(--action)' : '1px solid var(--border-mid)',
                fontWeight: active ? 500 : 400,
              }}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Price + toggle row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Price range */}
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Preço:
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              R${precoRange[0].toLocaleString('pt-BR')}
            </span>
            <div className="relative flex items-center gap-1.5">
              <input
                type="range"
                min={precoMin}
                max={precoMax}
                value={precoRange[0]}
                step={100}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (v < precoRange[1]) onPrecoRange([v, precoRange[1]])
                }}
                className="w-20 h-1 appearance-none rounded cursor-pointer"
                style={{ accentColor: 'var(--action)' }}
              />
              <input
                type="range"
                min={precoMin}
                max={precoMax}
                value={precoRange[1]}
                step={100}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (v > precoRange[0]) onPrecoRange([precoRange[0], v])
                }}
                className="w-20 h-1 appearance-none rounded cursor-pointer"
                style={{ accentColor: 'var(--action)' }}
              />
            </div>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              R${precoRange[1].toLocaleString('pt-BR')}
            </span>
          </div>
        </div>

        {/* Separator */}
        <div
          className="hidden sm:block w-px h-4"
          style={{ background: 'var(--border-mid)' }}
        />

        {/* Only discount toggle */}
        <button
          onClick={() => onApenasDesconto(!apenasDesconto)}
          className="flex items-center gap-2 text-sm"
          style={{ color: apenasDesconto ? 'var(--foreground)' : 'var(--muted-foreground)' }}
        >
          {/* iOS-style toggle */}
          <div
            className="relative w-10 h-6 rounded-full transition-colors duration-200"
            style={{ background: apenasDesconto ? 'var(--success)' : 'var(--border-mid)' }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full transition-transform duration-200"
              style={{
                background: '#fff',
                transform: apenasDesconto ? 'translateX(18px)' : 'translateX(2px)',
              }}
            />
          </div>
          <span>Apenas com desconto</span>
        </button>
      </div>
    </div>
  )
}
