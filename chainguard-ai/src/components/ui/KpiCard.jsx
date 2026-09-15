const COLOR_MAP = {
  blue:   { val: '#1a56db', dot: '#bfdbfe', bg: '#eff6ff' },
  red:    { val: '#dc2626', dot: '#fecaca', bg: '#fef2f2' },
  orange: { val: '#ea580c', dot: '#fed7aa', bg: '#fff7ed' },
  yellow: { val: '#d97706', dot: '#fde68a', bg: '#fffbeb' },
  green:  { val: '#16a34a', dot: '#bbf7d0', bg: '#f0fdf4' },
  cyan:   { val: '#0d9488', dot: '#99f6e4', bg: '#f0fdfa' },
  purple: { val: '#7c3aed', dot: '#ddd6fe', bg: '#f5f3ff' },
}

export default function KpiCard({ label, value, subtext, icon: Icon, color = 'blue', pulse = false }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue
  return (
    <div
      className={`relative rounded-lg p-4 transition-all ${pulse ? 'alert-critical' : ''}`}
      style={{
        background: '#ffffff',
        border: '1px solid #e2e6ed',
        boxShadow: '0 1px 3px rgba(0,0,0,.05)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#94a3b8' }}>{label}</p>
        {Icon && (
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: c.bg }}>
            <Icon size={14} style={{ color: c.val }} />
          </div>
        )}
      </div>
      <p className="text-3xl font-bold leading-none tracking-tight" style={{ color: c.val, fontVariantNumeric: 'tabular-nums' }}>
        {value ?? '—'}
      </p>
      {subtext && <p className="mt-1.5 text-xs" style={{ color: '#94a3b8' }}>{subtext}</p>}
    </div>
  )
}
