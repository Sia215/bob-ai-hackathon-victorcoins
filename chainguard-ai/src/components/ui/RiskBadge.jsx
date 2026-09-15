const RISK_STYLES = {
  Critical: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  High:     { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  Medium:   { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  Low:      { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  Minimal:  { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
}

export default function RiskBadge({ level }) {
  const s = RISK_STYLES[level] || RISK_STYLES.Minimal
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {level}
    </span>
  )
}
