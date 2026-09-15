import { useState, useMemo } from 'react'
import { useApi } from '../hooks/useApi'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import KpiCard from '../components/ui/KpiCard'
import Modal from '../components/ui/Modal'
import { Thermometer, AlertTriangle, Battery, Droplets, Clock, Package } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'

const REG_FRAMEWORKS = ['EU GMP Annex 15', 'WHO PQS', 'FDA 21 CFR', 'IATA DGR', 'FSMA']

const REG_STATUS_STYLE = {
  Pass:   'text-green-400 bg-green-500/15 border-green-500/30',
  Watch:  'text-yellow-400 bg-yellow-500/15 border-yellow-500/30',
  Breach: 'text-red-400 bg-red-500/15 border-red-500/30',
}

/**
 * Normalise a Prisma Shipment (cold-chain) into the sensor card shape.
 * Backend getColdChainOverview returns Shipment rows with latestReading nested.
 */
function normaliseSensor(s) {
  const r = s.latestReading
  const alerts = s.activeAlerts || []
  const hasAlert = s.hasActiveAlert || alerts.length > 0

  // Determine temperature excursion state
  const temp = r?.temperature ?? null
  const minT = r?.safeMinTemp ?? null
  const maxT = r?.safeMaxTemp ?? null
  const isExcursion = temp != null && minT != null && maxT != null && (temp < minT || temp > maxT)
  const isCritical  = isExcursion && alerts.some(a => a.severity === 'CRITICAL')
  const isWarning   = isExcursion && !isCritical

  const severity = isCritical ? 'Critical' : isWarning ? 'Warning' : (hasAlert ? 'Warning' : 'Normal')

  // Build safe range string
  const safeRange = (minT != null && maxT != null) ? `${minT}°C – ${maxT}°C` : 'N/A'

  // Excursion duration from the oldest unresolved alert (duration stored as minutes)
  const oldestAlert = alerts[alerts.length - 1]
  const excursionDuration = oldestAlert?.duration
    ? `${Math.round(oldestAlert.duration / 60)}h ${oldestAlert.duration % 60}m`
    : null

  return {
    id:                 s.id,
    shipmentId:         s.shipmentCode,
    product:            s.cargoType,
    location:           s.destination,
    temperature:        temp ?? '—',
    humidity:           r?.humidity ?? null,
    safeRange,
    severity,
    batteryLevel:       r?.batteryLevel ?? null,
    excursionDuration,
    temperatureHistory: [], // populated by readings endpoint if needed
    regulatoryBreach:   isCritical,
    recommendedAction:  alerts[0]?.description ?? null,
    regulatory:         {},  // derive from severity below
  }
}

function TempSparkline({ readings }) {
  if (!readings || readings.length < 2) return null
  const data = readings.map((t, i) => ({ t, i }))
  return (
    <div className="h-10 mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="t" stroke="#06b6d4" strokeWidth={1.5} dot={false} />
          <Tooltip contentStyle={{ display: 'none' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function BatteryBar({ level }) {
  const color = level > 50 ? '#22c55e' : level > 20 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-2">
      <Battery size={12} className="text-slate-500" />
      <div className="flex-1 h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${level}%`, background: color }} />
      </div>
      <span className="text-xs text-slate-500">{level}%</span>
    </div>
  )
}

function SensorCard({ sensor, onCritical }) {
  const isCritical = sensor.severity === 'Critical'
  const isWarning  = sensor.severity === 'Warning'
  const tempColor  = isCritical ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-green-400'
  const borderColor = isCritical ? 'border-red-500/40' : isWarning ? 'border-yellow-500/30' : 'border-[#1e293b]'

  return (
    <div className={`rounded-xl border p-4 ${borderColor} ${isCritical ? 'pulse-red' : ''}`}
      style={{ background: '#111827' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-blue-400 text-xs font-semibold">{sensor.shipmentId}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
          isCritical ? 'bg-red-500/15 text-red-400 border-red-500/30' :
          isWarning ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' :
          'bg-green-500/15 text-green-400 border-green-500/30'
        }`}>{sensor.severity}</span>
      </div>

      <p className="text-white font-bold text-sm mb-0.5">{sensor.product}</p>
      <p className="text-slate-500 text-xs mb-3 flex items-center gap-1">
        <Package size={11} /> {sensor.location}
      </p>

      {/* Temperature */}
      <div className="flex items-end gap-3 mb-1">
        <div className="flex items-baseline gap-1">
          <span className={`text-4xl font-extrabold leading-none tracking-tight ${tempColor}`}>
            {sensor.temperature}
          </span>
          <span className="text-slate-500 text-sm">°C</span>
        </div>
        {sensor.humidity != null && (
          <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
            <Droplets size={12} className="text-cyan-400" />
            {sensor.humidity}%
          </div>
        )}
      </div>

      <p className="text-slate-500 text-xs mb-1">Safe range: {sensor.safeRange}</p>

      {/* Excursion duration */}
      {sensor.excursionDuration && (
        <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full mt-1 mb-2 ${
          isCritical ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                       'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
        }`}>
          <Clock size={11} /> Excursion: {sensor.excursionDuration}
        </div>
      )}

      <TempSparkline readings={sensor.temperatureHistory} />

      {/* Battery */}
      {sensor.batteryLevel != null && (
        <div className="mt-3">
          <BatteryBar level={sensor.batteryLevel} />
        </div>
      )}

      {/* Regulatory compliance */}
      <div className="mt-3 pt-3 border-t border-[#1e293b]">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Regulatory</p>
        <div className="space-y-1">
          {REG_FRAMEWORKS.map(fw => {
            const verdict = isCritical ? 'Breach' : isWarning ? 'Watch' : 'Pass'
            const style = REG_STATUS_STYLE[verdict] || REG_STATUS_STYLE.Pass
            return (
              <div key={fw} className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{fw}</span>
                <span className={`px-1.5 py-0.5 rounded border text-xs font-semibold ${style}`}>{verdict}</span>
              </div>
            )
          })}
        </div>
      </div>

      {isCritical && (
        <button
          onClick={() => onCritical(sensor)}
          className="mt-3 w-full py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold hover:bg-red-500/30 transition-colors"
        >
          ⚠ View Emergency Protocol
        </button>
      )}
    </div>
  )
}

export default function ColdChainPage() {
  // API returns { shipments: Shipment[], activeAlerts: ColdChainAlert[] }
  const { data: coldChain, loading, error, refetch } = useApi('/cold-chain')
  const [filter, setFilter] = useState('all')
  const [emergency, setEmergency] = useState(null)

  if (loading) return <LoadingSpinner size="lg" text="Loading cold chain..." />
  if (error)   return <ErrorState message={error} onRetry={refetch} />

  const rawShipments = coldChain?.shipments || []
  const sensors = rawShipments.map(normaliseSensor)

  const stats = {
    total:      sensors.length,
    critical:   sensors.filter(s => s.severity === 'Critical').length,
    warning:    sensors.filter(s => s.severity === 'Warning').length,
    regulatory: sensors.filter(s => s.regulatoryBreach).length,
  }

  const filtered = filter === 'all' ? sensors : sensors.filter(s => s.severity === filter)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Cold Chain Monitor</h1>
        <p className="text-slate-500 text-sm">{sensors.length} sensors monitored</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Monitored"          value={stats.total}      color="blue"   icon={Thermometer} />
        <KpiCard label="Critical Excursion" value={stats.critical}   color="red"    icon={AlertTriangle} pulse={stats.critical > 0} />
        <KpiCard label="Warnings"           value={stats.warning}    color="yellow" icon={AlertTriangle} />
        <KpiCard label="Reg. Breaches"      value={stats.regulatory} color="orange" icon={AlertTriangle} />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all','Critical','Warning','Normal'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === f ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'bg-[#111827] text-slate-400 border border-[#1e293b] hover:text-slate-200'
            }`}
          >
            {f === 'all' ? 'All' : f}
            {f !== 'all' && <span className="ml-1.5 text-slate-600">{sensors.filter(s => s.severity === f).length}</span>}
          </button>
        ))}
      </div>

      {/* Sensor cards */}
      {filtered.length === 0 ? (
        <EmptyState title="No sensors" description="No readings match the current filter" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(s => (
            <SensorCard key={s.id} sensor={s} onCritical={setEmergency} />
          ))}
        </div>
      )}

      {/* Emergency modal */}
      <Modal
        open={!!emergency}
        onClose={() => setEmergency(null)}
        title="⚠ COLD-CHAIN EMERGENCY"
        size="md"
      >
        {emergency && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/40 text-center">
              <p className="text-red-400 font-bold text-2xl mb-1">{emergency.temperature}°C</p>
              <p className="text-red-300 font-semibold">{emergency.product}</p>
              <p className="text-slate-400 text-sm mt-0.5">{emergency.shipmentId} • {emergency.location}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-[#1a2235] border border-[#253347]">
                <p className="text-slate-500 text-xs">Safe Range</p>
                <p className="text-white font-semibold mt-0.5">{emergency.safeRange}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#1a2235] border border-[#253347]">
                <p className="text-slate-500 text-xs">Excursion Duration</p>
                <p className="text-red-300 font-semibold mt-0.5">{emergency.excursionDuration || 'Ongoing'}</p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
              <p className="text-orange-300 font-semibold text-sm mb-2">Recommended Action</p>
              <p className="text-slate-300 text-sm">{emergency.recommendedAction || 'Isolate shipment and initiate emergency temperature control protocol immediately. Contact carrier and regulatory team.'}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
