import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const sizeClass = size === 'lg' ? 'max-w-3xl' : size === 'sm' ? 'max-w-sm' : 'max-w-xl'

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,.4)', backdropFilter: 'blur(3px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={`relative w-full ${sizeClass} rounded-xl overflow-hidden`}
        style={{ background: '#ffffff', border: '1px solid #e2e6ed', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #e2e6ed' }}
        >
          <h2 className="font-semibold text-base" style={{ color: '#0f172a' }}>{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded transition-colors"
            style={{ color: '#94a3b8' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f8f9fb'; e.currentTarget.style.color = '#475569' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[80vh] p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
