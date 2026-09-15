import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'

const TOAST_STYLES = {
  success: { icon: CheckCircle,   bg: '#f0fdf4', border: '#bbf7d0', iconColor: '#16a34a', text: '#15803d' },
  error:   { icon: AlertCircle,   bg: '#fef2f2', border: '#fecaca', iconColor: '#dc2626', text: '#b91c1c' },
  warning: { icon: AlertTriangle, bg: '#fffbeb', border: '#fde68a', iconColor: '#d97706', text: '#b45309' },
  info:    { icon: Info,          bg: '#eff6ff', border: '#bfdbfe', iconColor: '#1a56db', text: '#1e40af' },
}

function Toast({ toast, onRemove }) {
  const s = TOAST_STYLES[toast.type] || TOAST_STYLES.info
  const Icon = s.icon
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-lg max-w-sm w-full"
      style={{ background: s.bg, border: `1px solid ${s.border}`, boxShadow: '0 4px 16px rgba(0,0,0,.1)' }}
    >
      <Icon size={15} style={{ color: s.iconColor, flexShrink: 0, marginTop: '1px' }} />
      <p className="text-sm flex-1" style={{ color: s.text }}>{toast.message}</p>
      <button onClick={() => onRemove(toast.id)} style={{ color: '#94a3b8' }}>
        <X size={13} />
      </button>
    </div>
  )
}

export default function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map(t => <Toast key={t.id} toast={t} onRemove={onRemove} />)}
    </div>
  )
}
