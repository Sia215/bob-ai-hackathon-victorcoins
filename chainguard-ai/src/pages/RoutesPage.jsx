import { useApi } from '../hooks/useApi'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import RiskBadge from '../components/ui/RiskBadge'
import { Route, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react'

function toTitle(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function formatDuration(hrs) {
  if (hrs == null) return '—'
  const h = Math.floor(hrs)
  const m = Math.round((hrs - h) * 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function normaliseRoute(r) {
  return {
    id:           r.id,
    name:         r.name,
    routeCode:    r.routeCode,
    origin:       r.origin,
    destination:  r.destination,
    riskLevel:    toTitle(r.riskLevel),
    distanceKm:   r.distanceKm,
    durationHrs:  r.durationHrs,
    isActive:     r.isActive,
    alternatives: (r.alternatives || []).map(a => ({
      id:             a.id,
      name:           a.name,
      riskLevel:      toTitle(a.riskLevel),
      distanceKm:     a.distanceKm,
      durationHrs:    a.durationHrs,
      costMultiplier: a.costMultiplier,
      reason:         a.reason,
    })),
  }
}

function MetricRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1.5" style={{ borderBottom: '1px solid #f1f5f9' }}>
      <span className="text-xs" style={{ color: '#94a3b8' }}>{label}</span>
      <span className="text-xs font-medium" style={{ color: '#0f172a' }}>{value}</span>
    </div>
  )
}

function RouteCard({ route }) {
  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: '#eff6ff' }}>
            <Route size={14} style={{ color: '#1a56db' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm" style={{ color: '#0f172a' }}>{route.name}</span>
              <span className="font-mono text-xs" style={{ color: '#94a3b8' }}>{route.routeCode}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: '#475569' }}>
              <span>{route.origin}</span>
              <ArrowRight size={11} style={{ color: '#cbd5e1' }} />
              <span>{route.destination}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RiskBadge level={route.riskLevel} />
          <span
            className="text-xs font-medium px-2 py-0.5 rounded"
            style={route.isActive
              ? { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }
              : { background: '#f8f9fb', color: '#94a3b8', border: '1px solid #e2e6ed' }
            }
          >
            {route.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Route comparison */}
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Current route */}
          <div className="p-4 rounded-lg" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <div className="flex items-center gap-1.5 mb-3">
              <CheckCircle2 size={12} style={{ color: '#1a56db' }} />
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#1a56db' }}>Current Route</p>
            </div>
            <MetricRow label="Risk" value={<RiskBadge level={route.riskLevel} />} />
            <MetricRow label="Distance" value={route.distanceKm ? `${route.distanceKm.toFixed(0)} km` : '—'} />
            <MetricRow label="Duration" value={formatDuration(route.durationHrs)} />
          </div>

          {/* Alternatives */}
          {route.alternatives.length === 0 ? (
            <div
              className="p-4 rounded-lg flex items-center justify-center text-xs"
              style={{ background: '#f8f9fb', border: '1px solid #e2e6ed', color: '#94a3b8' }}
            >
              No alternatives defined
            </div>
          ) : (
            route.alternatives.map((alt, i) => (
              <div key={alt.id || i} className="p-4 rounded-lg" style={{ background: '#f8f9fb', border: '1px solid #e2e6ed' }}>
                <div className="flex items-center gap-1.5 mb-3">
                  <AlertTriangle size={12} style={{ color: '#d97706' }} />
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#d97706' }}>
                    Alternative {String.fromCharCode(65 + i)}
                  </p>
                </div>
                <MetricRow label="Risk" value={<RiskBadge level={alt.riskLevel} />} />
                <MetricRow label="Distance" value={alt.distanceKm ? `${alt.distanceKm.toFixed(0)} km` : '—'} />
                <MetricRow label="Duration" value={formatDuration(alt.durationHrs)} />
                <MetricRow label="Cost ×" value={alt.costMultiplier?.toFixed(2) ?? '1.00'} />
                {alt.reason && (
                  <details className="mt-3">
                    <summary className="text-xs cursor-pointer font-medium" style={{ color: '#1a56db' }}>Why this route?</summary>
                    <p className="text-xs mt-2 leading-relaxed" style={{ color: '#475569' }}>{alt.reason}</p>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default function RoutesPage() {
  const { data: routes, loading, error, refetch } = useApi('/routes')

  if (loading) return <LoadingSpinner size="lg" text="Loading routes..." />
  if (error)   return <ErrorState message={error} onRetry={refetch} />

  const routeList = (routes || []).map(normaliseRoute)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Route Intelligence</h1>
        <p className="page-subtitle">{routeList.length} routes analyzed</p>
      </div>

      {routeList.length === 0 ? (
        <EmptyState title="No route data" description="Route analysis unavailable" />
      ) : (
        <div className="space-y-4">
          {routeList.map((route, i) => (
            <RouteCard key={route.id || i} route={route} />
          ))}
        </div>
      )}
    </div>
  )
}
