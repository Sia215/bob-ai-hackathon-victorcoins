import { useApi } from '../hooks/useApi'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { Globe, Layers } from 'lucide-react'
import { lazy, Suspense } from 'react'

const LogisticsGlobe = lazy(() => import('../components/globe/LogisticsGlobe'))

const LEGEND = [
  { color: '#16a34a', label: 'Low Risk', type: 'line' },
  { color: '#d97706', label: 'Medium Risk', type: 'line' },
  { color: '#ea580c', label: 'High Risk', type: 'line' },
  { color: '#dc2626', label: 'Critical', type: 'line' },
  { color: '#1a56db', label: 'Hub', type: 'dot' },
  { color: '#dc2626', label: 'Disruption Zone', type: 'dot', pulse: true },
]

export default function GlobePage() {
  const { data: shipments } = useApi('/shipments')
  const { data: disruptions } = useApi('/disruptions')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <Globe size={16} style={{ color: '#1a56db' }} />
          </div>
          <div>
            <h1 className="page-title">Digital Twin</h1>
            <p className="page-subtitle">Live 3D logistics network visualization</p>
          </div>
        </div>

        {/* Legend */}
        <div className="hidden md:flex items-center gap-4 flex-wrap">
          {LEGEND.map(({ color, label, type, pulse }) => (
            <div key={label} className="flex items-center gap-1.5">
              {type === 'line'
                ? <span className="w-4 h-0.5 rounded inline-block" style={{ background: color }} />
                : <span
                    className={`w-2.5 h-2.5 rounded-full inline-block ${pulse ? 'animate-pulse' : ''}`}
                    style={{ background: color }}
                  />
              }
              <span className="text-xs" style={{ color: '#64748b' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Globe */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: '1px solid #e2e6ed', boxShadow: '0 2px 8px rgba(0,0,0,.07)' }}
      >
        <Suspense fallback={
          <div className="flex items-center justify-center" style={{ height: '70vh', background: '#f8f9fb' }}>
            <LoadingSpinner text="Loading 3D globe..." />
          </div>
        }>
          <LogisticsGlobe
            shipments={shipments}
            disruptions={disruptions}
            height="70vh"
          />
        </Suspense>
      </div>

      <p className="text-xs text-center" style={{ color: '#94a3b8' }}>
        Drag to rotate · Scroll to zoom · Arcs show active shipment routes
      </p>
    </div>
  )
}
