'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

interface CopyToastProps {
  visible: boolean
}

export function CopyToast({ visible }: CopyToastProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      setShow(true)
      const t = setTimeout(() => setShow(false), 2000)
      return () => clearTimeout(t)
    }
  }, [visible])

  return (
    <div
      aria-live="polite"
      role="status"
      className="fixed bottom-6 left-1/2 z-[60] flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
      style={{
        background: 'var(--toast-bg)',
        color: 'var(--foreground)',
        border: '1px solid var(--success)',
        transform: `translateX(-50%) translateY(${show ? '0' : '16px'})`,
        opacity: show ? 1 : 0,
        pointerEvents: 'none',
      }}
    >
      <Check size={14} style={{ color: 'var(--success)' }} />
      Mensagem copiada
    </div>
  )
}
