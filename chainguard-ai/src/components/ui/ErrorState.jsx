import { AlertCircle, RefreshCw } from 'lucide-react'

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertCircle size={36} style={{ color: '#fca5a5', marginBottom: '12px' }} />
      <p className="font-semibold" style={{ color: '#475569' }}>Failed to load data</p>
      {message && <p className="text-sm mt-1 max-w-sm" style={{ color: '#94a3b8' }}>{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          style={{ background: '#fff', border: '1px solid #e2e6ed', color: '#475569' }}
          onMouseEnter={e => e.currentTarget.style.background = '#f8f9fb'}
          onMouseLeave={e => e.currentTarget.style.background = '#fff'}
        >
          <RefreshCw size={13} /> Retry
        </button>
      )}
    </div>
  )
}
