'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Plus, Trash2, Settings } from 'lucide-react'

interface MonitoredDrawerProps {
  termos: string[]
  onSalvar: (termos: string[]) => void
}

export function MonitoredDrawer({ termos, onSalvar }: MonitoredDrawerProps) {
  const [aberto, setAberto] = useState(false)
  const [lista, setLista] = useState<string[]>(termos)
  const [novoTermo, setNovoTermo] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync external termos → local list when drawer opens
  useEffect(() => {
    if (aberto) setLista(termos)
  }, [aberto, termos])

  function adicionarTermo() {
    const t = novoTermo.trim()
    if (!t || lista.includes(t)) return
    setLista((prev) => [...prev, t])
    setNovoTermo('')
    inputRef.current?.focus()
  }

  function removerTermo(idx: number) {
    setLista((prev) => prev.filter((_, i) => i !== idx))
  }

  function salvar() {
    onSalvar(lista)
    setAberto(false)
  }

  return (
    <>
      {/* FAB trigger */}
      <button
        onClick={() => setAberto(true)}
        aria-label="Produtos monitorados"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 active:scale-95"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-mid)',
          color: 'var(--muted-foreground)',
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
        <Settings size={18} />
      </button>

      {/* Backdrop */}
      {aberto && (
        <div
          className="fixed inset-0 z-50"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setAberto(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        role="dialog"
        aria-label="Produtos monitorados"
        aria-modal="true"
        className="fixed top-0 right-0 h-full z-50 flex flex-col w-80 max-w-full transition-transform duration-300 ease-out"
        style={{
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border-subtle)',
          transform: aberto ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <span className="font-semibold text-sm" style={{ color: 'var(--foreground)', letterSpacing: '-0.01em' }}>
            Produtos monitorados
          </span>
          <button
            onClick={() => setAberto(false)}
            aria-label="Fechar"
            className="transition-colors duration-200"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--foreground)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted-foreground)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* List */}
        <ul className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
          {lista.length === 0 && (
            <li className="text-sm text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
              Nenhum termo adicionado
            </li>
          )}
          {lista.map((termo, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between py-2 px-3 rounded-lg"
              style={{ background: 'var(--border-subtle)' }}
            >
              <span className="text-sm truncate flex-1" style={{ color: 'var(--foreground)' }}>
                {termo}
              </span>
              <button
                onClick={() => removerTermo(idx)}
                aria-label={`Remover ${termo}`}
                className="ml-2 flex-shrink-0 transition-colors duration-200"
                style={{ color: 'var(--muted-foreground)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#FF453A' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted-foreground)' }}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>

        {/* Add term */}
        <div className="px-5 py-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: 'var(--border-subtle)' }}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Novo termo de busca..."
              value={novoTermo}
              onChange={(e) => setNovoTermo(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') adicionarTermo() }}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--foreground)' }}
            />
            <button
              onClick={adicionarTermo}
              aria-label="Adicionar termo"
              disabled={!novoTermo.trim()}
              className="flex-shrink-0 transition-colors duration-200 disabled:opacity-30"
              style={{ color: 'var(--action)' }}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Save button */}
        <div className="px-5 pb-6 pt-2">
          <button
            onClick={salvar}
            className="w-full py-2.5 text-sm font-medium rounded-lg transition-all duration-200 active:scale-95"
            style={{ background: 'var(--action)', color: '#fff' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            Salvar e buscar
          </button>
        </div>
      </aside>
    </>
  )
}
