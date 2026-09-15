export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sz = size === 'lg' ? 'w-9 h-9' : size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className={`${sz} rounded-full animate-spin`} style={{ border: '2px solid #e2e6ed', borderTopColor: '#1a56db' }} />
      {text && <p className="text-sm" style={{ color: '#94a3b8' }}>{text}</p>}
    </div>
  )
}
