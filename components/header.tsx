'use client'

import { Moon, Sun, RefreshCw } from 'lucide-react'

interface HeaderProps {
  onAtualizar: () => void
  isLoading?: boolean
  tema: 'dark' | 'light'
  onToggleTema: () => void
}

export function Header({ onAtualizar, isLoading, tema, onToggleTema }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
      style={{
        backgroundColor: 'var(--header-bg)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}
    >
      <div className="flex flex-col gap-0.5">
        <span
          className="text-lg leading-tight text-pretty"
          style={{ color: 'var(--foreground)', fontWeight: 600, letterSpacing: '-0.02em' }}
        >
          Apple Deals
        </span>
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Mercado Livre &middot; Ofertas em tempo real
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={onToggleTema}
          aria-label={tema === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200"
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
          {tema === 'dark'
            ? <Sun size={15} />
            : <Moon size={15} />
          }
        </button>

        {/* Refresh button */}
        <button
          onClick={onAtualizar}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg transition-all duration-200 disabled:opacity-50"
          style={{
            border: '1px solid var(--action)',
            color: 'var(--action)',
            background: 'transparent',
            fontWeight: 500,
            letterSpacing: '-0.01em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--action)'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--action)'
          }}
        >
          <RefreshCw
            size={13}
            className={isLoading ? 'animate-spin' : ''}
          />
          {isLoading ? 'Atualizando...' : 'Atualizar ofertas'}
        </button>
      </div>
    </header>
  )
}
