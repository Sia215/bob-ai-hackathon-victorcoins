const STATUS_STYLES = {
  'In Transit':  { bg: '#eff6ff', color: '#1a56db', border: '#bfdbfe' },
  'At Risk':     { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  'Critical':    { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  'Delayed':     { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  'Delivered':   { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  'On Hold':     { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
  'Active':      { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  'Idle':        { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  'Maintenance': { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  'Stranded':    { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  'Monitoring':  { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  'Resolved':    { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
}

export default function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {status}
    </span>
  )
}
