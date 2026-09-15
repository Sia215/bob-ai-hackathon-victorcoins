import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import RiskBadge from '../components/ui/RiskBadge'
import StatusBadge from '../components/ui/StatusBadge'
import {
  AlertTriangle, Waves, Wind, Zap, Cloud, Globe2,
  ChevronDown, ChevronUp, Package, TrendingUp, CalendarClock
} from 'lucide-react'

const TYPE_ICONS = {
  flood:        Waves,
  storm:        Wind,
  earthquake:   Zap,
  weather:      Cloud,
  geopolitical: Globe2,
  default:      AlertTriangle,
}

// Normalise Prisma disruption (UPPER_CASE → Title Case)
function normalise(d) {
  return {
    ...d,
    severity: toTitle(d.severity),   // CRITICAL → Critical
    status:   toTitle(d.status),     // ACTIVE → Active
  }
}

function toTitle(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function formatDate(dt) {
  if (!dt) return 'Unknown'
  try { return new Date(dt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return 'Unknown' }
}

function DisruptionCard({ disruption }) {
  const [expanded, setExpanded] = useState(false)
  const IconComp = TYPE_ICONS[disruption.type?.toLowerCase()] || TYPE_ICONS.default
  const severityBorder = {
    Critical: 'border-red-500/40',
    High:     'border-orange-500/40',
    Medium:   'border-yellow-500/40',
    Low:      'border-green-500/40',
  }

  return (
    <div className={`rounded-xl border ${severityBorder[disruption.severity] || 'border-[#1e293b]'} overflow-hidden transition-all`}
      style={{ background: '#111827' }}>
      {/* Card header */}
      <div
        className="p-5 cursor-pointer hover:brightness-110 transition-all"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              disruption.severity === 'Critical' ? 'bg-red-500/20' : disruption.severity === 'High' ? 'bg-orange-500/20' : 'bg-yellow-500/20'
            }`}>
              <IconComp size={18} className={
                disruption.severity === 'Critical' ? 'text-red-400' : disruption.severity === 'High' ? 'text-orange-400' : 'text-yellow-400'
              } />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-white font-bold text-sm">{disruption.name}</h3>
                <RiskBadge level={disruption.severity} />
                <StatusBadge status={disruption.status} />
              </div>
              <p className="text-slate-500 text-xs">{disruption.description}</p>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">📍 {disruption.location}</span>
                <span className="flex items-center gap-1"><Package size={11} /> {disruption.affectedCount ?? disruption.affectedShipments?.length ?? 0} shipments</span>
                <span className="flex items-center gap-1"><TrendingUp size={11} /> {disruption.radiusKm}km radius</span>
              </div>
            </div>
          </div>
          <button className="text-slate-500 hover:text-slate-300 shrink-0">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-[#1e293b] pt-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-[#1a2235] border border-[#253347]">
              <p className="text-slate-500 text-xs">Started</p>
              <p className="text-orange-300 font-bold text-sm mt-0.5">{formatDate(disruption.startTime)}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#1a2235] border border-[#253347]">
              <p className="text-slate-500 text-xs">Expected End</p>
              <p className="text-white font-bold text-sm mt-0.5">{formatDate(disruption.expectedEndTime)}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#1a2235] border border-[#253347]">
              <p className="text-slate-500 text-xs">Affected</p>
              <p className="text-red-300 font-bold text-sm mt-0.5">{disruption.affectedCount ?? disruption.affectedShipments?.length ?? 0} shipments</p>
            </div>
          </div>

          {/* Affected shipment IDs */}
          {disruption.affectedShipments && disruption.affectedShipments.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Affected Shipment IDs</p>
              <div className="flex flex-wrap gap-2">
                {disruption.affectedShipments.slice(0, 8).map((item, i) => (
                  <span key={i} className="px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-300 font-mono text-xs">
                    {item.shipmentId ?? item.id ?? `#${i+1}`}
                  </span>
                ))}
                {disruption.affectedShipments.length > 8 && (
                  <span className="px-2 py-1 text-slate-500 text-xs">+{disruption.affectedShipments.length - 8} more</span>
                )}
              </div>
            </div>
          )}

          {/* Coordinates */}
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <CalendarClock size={11} />
            <span>Disruption Code: <span className="text-slate-500 font-mono">{disruption.disruptionCode}</span></span>
            <span>•</span>
            <span>{disruption.latitude?.toFixed(3)}, {disruption.longitude?.toFixed(3)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DisruptionsPage() {
  const { data: rawDisruptions, loading, error, refetch } = useApi('/disruptions')
  const [filter, setFilter] = useState('all')

  if (loading) return <LoadingSpinner size="lg" text="Loading disruptions..." />
  if (error)   return <ErrorState message={error} onRetry={refetch} />

  const disruptions = (rawDisruptions || []).map(normalise)
  const filtered = filter === 'all' ? disruptions : disruptions.filter(d => d.severity?.toLowerCase() === filter.toLowerCase())

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Disruptions</h1>
        <p className="text-slate-500 text-sm">{disruptions.length} disruptions tracked</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['all','Critical','High','Medium','Low'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === f
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : 'bg-[#111827] text-slate-400 border border-[#1e293b] hover:text-slate-200'
            }`}
          >
            {f === 'all' ? 'All' : f}
            {f !== 'all' && (
              <span className="ml-1.5 text-slate-600">{disruptions.filter(d => d.severity === f).length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Cards */}
      {!filtered || filtered.length === 0 ? (
        <EmptyState title="No disruptions" description="All clear for now" />
      ) : (
        <div className="space-y-4">
          {filtered.map(d => <DisruptionCard key={d.id} disruption={d} />)}
        </div>
      )}
    </div>
  )
}
