'use client'

interface HeaderProps {
  onAtualizar: () => void
  isLoading?: boolean
}

export function Header({ onAtualizar, isLoading }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
      style={{
        backgroundColor: 'rgba(0,0,0,0.85)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
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

      <button
        onClick={onAtualizar}
        disabled={isLoading}
        className="px-4 py-1.5 text-sm rounded-lg transition-all duration-200 disabled:opacity-50"
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
        {isLoading ? 'Atualizando...' : 'Atualizar ofertas'}
      </button>
    </header>
  )
}
