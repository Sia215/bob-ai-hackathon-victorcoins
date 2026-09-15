import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { useToast } from '../hooks/useToast'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import StatusBadge from '../components/ui/StatusBadge'
import Modal from '../components/ui/Modal'
import KpiCard from '../components/ui/KpiCard'
import { Truck, Ship, Plane, Train, Fuel, RefreshCw } from 'lucide-react'

const TYPE_ICONS = { truck: Truck, vessel: Ship, plane: Plane, rail: Train, default: Truck }

// Normalise a raw Prisma FleetAsset to the shape expected by AssetCard
function normaliseAsset(a) {
  return {
    id:                a.id,
    code:              a.assetCode,
    type:              a.assetType?.toLowerCase() || 'truck',
    location:          a.currentLocation,
    status:            toTitleCase(a.status),        // IDLE → Idle
    capacity:          a.capacity ?? 0,
    usedCapacity:      Math.round((a.utilization ?? 0) * (a.capacity ?? 0) / 100),
    capacityUnit:      'tons',
    availableFrom:     a.availableFrom ? new Date(a.availableFrom).toLocaleDateString() : 'Now',
    currentAssignment: a.currentAssignment?.shipment?.shipmentCode ?? null,
    carrier:           a.carrier?.name ?? null,
  }
}

function toTitleCase(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function CapacityBar({ used, total, color = '#3b82f6' }) {
  const pct = total > 0 ? Math.round((used / total) * 100) : 0
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>Utilization</span>
        <span className="font-semibold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function AssetCard({ asset, onRedeploy }) {
  const IconComp = TYPE_ICONS[asset.type?.toLowerCase()] || TYPE_ICONS.default
  const isIdle = asset.status === 'Idle'
  const statusColor = { Active: '#22c55e', Idle: '#f59e0b', Maintenance: '#f97316', Stranded: '#ef4444' }

  return (
    <div className={`rounded-xl border p-4 transition-all ${isIdle ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-[#1e293b]'}`}
      style={{ background: isIdle ? undefined : '#111827' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isIdle ? 'bg-yellow-500/20' : 'bg-blue-500/10'}`}>
            <IconComp size={16} className={isIdle ? 'text-yellow-400' : 'text-blue-400'} />
          </div>
          <div>
            <p className="text-white font-bold text-sm font-mono">{asset.code}</p>
            <p className="text-slate-500 text-xs capitalize">{asset.type}</p>
          </div>
        </div>
        <StatusBadge status={asset.status} />
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Location</span>
          <span className="text-slate-300 text-right max-w-[150px] truncate">{asset.location || '—'}</span>
        </div>
        {asset.carrier && (
          <div className="flex justify-between">
            <span className="text-slate-500">Carrier</span>
            <span className="text-slate-300 text-right max-w-[150px] truncate">{asset.carrier}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-slate-500">Capacity</span>
          <span className="text-slate-300">{asset.usedCapacity}/{asset.capacity} {asset.capacityUnit}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Available</span>
          <span className="text-slate-300">{asset.availableFrom}</span>
        </div>
        {asset.currentAssignment ? (
          <div className="flex justify-between">
            <span className="text-slate-500">Assignment</span>
            <span className="text-blue-400 font-mono text-xs">{asset.currentAssignment}</span>
          </div>
        ) : (
          <p className="text-green-400 text-xs font-semibold">Available Now</p>
        )}
      </div>

      <CapacityBar
        used={asset.usedCapacity}
        total={asset.capacity || 100}
        color={statusColor[asset.status] || '#3b82f6'}
      />

      {isIdle && (
        <button
          onClick={() => onRedeploy(asset)}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs font-semibold hover:bg-yellow-500/30 transition-colors"
        >
          <RefreshCw size={12} /> Redeploy
        </button>
      )}
    </div>
  )
}

export default function FleetPage() {
  // API returns { summary, assets }
  const { data: fleetData, loading, error, refetch } = useApi('/fleet')
  const { addToast } = useToast()
  const { data: recs } = useApi('/recommendations')
  const [redeployModal, setRedeployModal] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

  if (loading) return <LoadingSpinner size="lg" text="Loading fleet..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const rawAssets = fleetData?.assets || []
  const assets = rawAssets.map(normaliseAsset)
  const summary = fleetData?.summary || {}

  const filtered = statusFilter === 'all' ? assets : assets.filter(a => a.status === statusFilter)

  const stats = {
    total:       summary.total       ?? assets.length,
    active:      summary.active      ?? assets.filter(a => a.status === 'Active').length,
    idle:        summary.idle        ?? assets.filter(a => a.status === 'Idle').length,
    maintenance: summary.maintenance ?? assets.filter(a => a.status === 'Maintenance').length,
    stranded:    summary.stranded    ?? assets.filter(a => a.status === 'Stranded').length,
  }

  const handleRedeploy = (asset) => {
    const match = recs?.find(r => r.recommendationType === 'REDEPLOY')
    setRedeployModal({ asset, recommendation: match })
  }

  const confirmRedeploy = () => {
    addToast(`Redeployment order sent for ${redeployModal.asset.code}`, 'success')
    setRedeployModal(null)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Fleet Management</h1>
        <p className="text-slate-500 text-sm">{assets.length} assets tracked · avg utilization {summary.avgUtilization ?? 0}%</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Total Assets"  value={stats.total}       color="blue"   icon={Truck} />
        <KpiCard label="Active"        value={stats.active}      color="green"  icon={Truck} />
        <KpiCard label="Idle"          value={stats.idle}        color="yellow" icon={Truck} />
        <KpiCard label="Maintenance"   value={stats.maintenance} color="orange" icon={Truck} />
        <KpiCard label="Stranded"      value={stats.stranded}    color="red"    icon={Truck} />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all','Active','Idle','Maintenance','Stranded'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === s
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : 'bg-[#111827] text-slate-400 border border-[#1e293b] hover:text-slate-200'
            }`}
          >
            {s === 'all' ? 'All' : s}
            {s !== 'all' && <span className="ml-1.5 text-slate-600">{assets.filter(a => a.status === s).length}</span>}
          </button>
        ))}
      </div>

      {/* Asset grid */}
      {filtered.length === 0 ? (
        <EmptyState title="No assets" description="No fleet assets match this filter" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filtered.map(asset => (
            <AssetCard key={asset.id} asset={asset} onRedeploy={handleRedeploy} />
          ))}
        </div>
      )}

      {/* Redeploy modal */}
      <Modal open={!!redeployModal} onClose={() => setRedeployModal(null)} title="Redeploy Asset">
        {redeployModal && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-[#1a2235] border border-[#253347]">
              <p className="text-white font-bold">{redeployModal.asset.code}</p>
              <p className="text-slate-400 text-sm capitalize">{redeployModal.asset.type} • {redeployModal.asset.location}</p>
            </div>
            {redeployModal.recommendation ? (
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-blue-300 text-sm font-semibold mb-1">Recommendation</p>
                <p className="text-slate-300 text-sm">{redeployModal.recommendation.reason}</p>
                {redeployModal.recommendation.title && (
                  <p className="text-blue-400 text-sm font-mono mt-2">→ {redeployModal.recommendation.title}</p>
                )}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No specific recommendation available. Proceed with manual assignment.</p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setRedeployModal(null)}
                className="flex-1 py-2 rounded-lg border border-[#253347] text-slate-300 text-sm hover:bg-[#1a2235] transition-colors">
                Cancel
              </button>
              <button onClick={confirmRedeploy}
                className="flex-1 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-sm font-semibold hover:bg-yellow-500/30 transition-colors">
                Confirm Redeploy
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
