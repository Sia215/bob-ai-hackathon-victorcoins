import { InboxIcon } from 'lucide-react'

export default function EmptyState({ title = 'No data', description, icon: Icon = InboxIcon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon size={36} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
      <p className="font-semibold" style={{ color: '#475569' }}>{title}</p>
      {description && <p className="text-sm mt-1 max-w-xs" style={{ color: '#94a3b8' }}>{description}</p>}
    </div>
  )
}
