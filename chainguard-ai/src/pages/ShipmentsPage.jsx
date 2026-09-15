import { useState, useMemo } from 'react'
import { useApi } from '../hooks/useApi'
import { apiGet } from '../api/client'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import RiskBadge from '../components/ui/RiskBadge'
import StatusBadge from '../components/ui/StatusBadge'
import { Package, X, Thermometer, MapPin, ArrowRight, AlertTriangle, ChevronRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const RISK_COLORS = { Critical: '#dc2626', High: '#ea580c', Medium: '#d97706', Low: '#16a34a' }
const CT = { background: '#fff', border: '1px solid #e2e6ed', borderRadius: 6, fontSize: 11, color: '#0f172a' }

function DrawerSection({ title, children }) {
  return (
    <div className="mb-5">
      <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#94a3b8' }}>{title}</h3>
      {children}
    </div>
  )
}

function InfoRow({ label, value, valueStyle }) {
  return (
    <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
      <span className="text-xs" style={{ color: '#94a3b8' }}>{label}</span>
      <span className="text-xs font-medium" style={{ color: '#0f172a', ...valueStyle }}>{value}</span>
    </div>
  )
}

function ShipmentDrawer({ shipment, open, onClose, addToast }) {
  const [riskDetail, setRiskDetail] = useState(null)
  const [loadingRisk, setLoadingRisk] = useState(false)
  const [recommendation, setRecommendation] = useState(null)

  const handleExplainRisk = async () => {
    setLoadingRisk(true)
    try {
      const all = await apiGet('/risks')
      const match = Array.isArray(all)
        ? all.find(r => r.shipmentId === shipment._numericId || r.shipment?.shipmentCode === shipment.id)
        : null
      if (match) {
        const factors = [
          { factor: 'Disruption', score: match.disruptionScore ?? 0, level: match.disruptionScore >= 20 ? 'Critical' : match.disruptionScore >= 10 ? 'High' : 'Medium' },
          { factor: 'Delay',      score: match.delayScore ?? 0,      level: match.delayScore >= 15 ? 'Critical' : match.delayScore >= 6 ? 'High' : 'Low' },
          { factor: 'Priority',   score: match.priorityScore ?? 0,   level: match.priorityScore >= 15 ? 'High' : 'Medium' },
          { factor: 'Route',      score: match.routeScore ?? 0,      level: match.routeScore >= 10 ? 'High' : 'Low' },
          { factor: 'Cold Chain', score: match.coldChainScore ?? 0,  level: match.coldChainScore >= 10 ? 'Critical' : 'Medium' },
          { factor: 'Carrier',    score: match.carrierScore ?? 0,    level: match.carrierScore >= 8 ? 'High' : 'Low' },
        ]
        setRiskDetail({ explanation: match.explanation, factors, score: match.score, level: match.level })
      } else {
        setRiskDetail({ explanation: 'No risk assessment found for this shipment.', factors: [] })
      }
      const recs = await apiGet('/recommendations')
      const rec = Array.isArray(recs) ? recs.find(r => r.shipmentId === shipment._numericId) : null
      setRecommendation(rec)
    } catch (err) {
      setRiskDetail({ explanation: `Risk details unavailable: ${err.message}`, factors: [] })
    } finally {
      setLoadingRisk(false)
    }
  }

  const handleApply = async () => {
    if (!addToast) return
    addToast(recommendation ? `Recommendation applied: ${recommendation.title}` : `Action queued for ${shipment.id}`, 'success')
    onClose()
  }

  if (!open || !shipment) return null

  const riskFactors = riskDetail?.factors || []

  return (
    <div className="fixed inset-0 z-[8000] flex" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="flex-1" style={{ background: 'rgba(15,23,42,.3)' }} onClick={onClose} />
      <div
        className="w-full max-w-lg h-full overflow-y-auto flex flex-col"
        style={{ background: '#ffffff', borderLeft: '1px solid #e2e6ed', boxShadow: '-8px 0 32px rgba(0,0,0,.1)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 sticky top-0"
          style={{ background: '#ffffff', borderBottom: '1px solid #e2e6ed' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: '#eff6ff' }}>
              <Package size={15} style={{ color: '#1a56db' }} />
            </div>
            <div>
              <h2 className="font-bold font-mono text-sm" style={{ color: '#0f172a' }}>{shipment.id}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusBadge status={shipment.status} />
                <RiskBadge level={shipment.riskLevel} />
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex-1">
          {/* Route */}
          <DrawerSection title="Route & Logistics">
            <div className="flex items-center gap-2 mb-3 text-sm" style={{ color: '#475569' }}>
              <MapPin size={13} style={{ color: '#1a56db' }} />
              <span className="font-medium">{shipment.origin}</span>
              <ArrowRight size={13} style={{ color: '#cbd5e1' }} />
              <span className="font-medium">{shipment.destination}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'ETA', value: shipment.eta || 'TBD' },
                { label: 'Carrier', value: shipment.carrierName || '—' },
                { label: 'Cargo', value: shipment.cargoType },
                { label: 'Delay', value: shipment.delayHours > 0 ? `+${shipment.delayHours}h` : 'On time',
                  valueStyle: { color: shipment.delayHours > 0 ? '#ea580c' : '#16a34a' } },
              ].map(({ label, value, valueStyle }) => (
                <div key={label} className="p-3 rounded-lg" style={{ background: '#f8f9fb', border: '1px solid #e2e6ed' }}>
                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>{label}</p>
                  <p className="text-sm font-semibold" style={{ color: '#0f172a', ...valueStyle }}>{value}</p>
                </div>
              ))}
            </div>
          </DrawerSection>

          {/* Cold Chain */}
          {shipment.coldChain && (
            <DrawerSection title="Cold Chain Status">
              <div className="p-3 rounded-lg" style={{ background: '#f0fdfa', border: '1px solid #99f6e4' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Thermometer size={13} style={{ color: '#0d9488' }} />
                  <span className="font-semibold text-sm" style={{ color: '#0d9488' }}>{shipment.coldChain.temperature}°C</span>
                  <span className="text-xs" style={{ color: '#94a3b8' }}>Safe: {shipment.coldChain.safeRange}</span>
                </div>
                <p className="text-xs" style={{ color: '#475569' }}>{shipment.coldChain.status}</p>
              </div>
            </DrawerSection>
          )}

          {/* Risk Explanation */}
          {riskDetail && (
            <DrawerSection title="Risk Analysis">
              <div className="p-3 rounded-lg mb-3" style={{ background: '#f8f9fb', border: '1px solid #e2e6ed' }}>
                <div className="flex items-center gap-2 mb-2">
                  <RiskBadge level={riskDetail.level ? (riskDetail.level.charAt(0) + riskDetail.level.slice(1).toLowerCase()) : shipment.riskLevel} />
                  {riskDetail.score != null && (
                    <span className="text-xs font-mono font-semibold" style={{ color: '#475569' }}>Score: {Math.round(riskDetail.score)}/100</span>
                  )}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>{riskDetail.explanation}</p>
              </div>
              {riskFactors.length > 0 && (
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={riskFactors} layout="vertical" barSize={10}>
                      <XAxis type="number" domain={[0, 30]} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="factor" tick={{ fill: '#64748b', fontSize: 10 }} width={80} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={CT} />
                      <Bar dataKey="score" radius={[0,3,3,0]}>
                        {riskFactors.map((f, i) => <Cell key={i} fill={RISK_COLORS[f.level] || '#94a3b8'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </DrawerSection>
          )}

          {/* Recommendation */}
          {recommendation && (
            <DrawerSection title="AI Recommendation">
              <div className="p-3 rounded-lg" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <p className="text-xs font-bold mb-1" style={{ color: '#1a56db' }}>{recommendation.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>{recommendation.reason}</p>
                <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>Est. impact: {recommendation.estimatedImpact}</p>
              </div>
            </DrawerSection>
          )}
        </div>

        {/* Footer */}
        <div
          className="sticky bottom-0 flex gap-3 px-6 py-4"
          style={{ background: '#ffffff', borderTop: '1px solid #e2e6ed' }}
        >
          <button
            onClick={handleExplainRisk}
            disabled={loadingRisk}
            className="flex-1 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            style={{ background: '#f8f9fb', border: '1px solid #e2e6ed', color: '#475569' }}
          >
            {loadingRisk ? 'Analysing…' : riskDetail ? 'Refresh Risk' : 'Explain Risk'}
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-2 rounded-md text-sm font-semibold text-white transition-colors"
            style={{ background: '#1a56db' }}
            onMouseEnter={e => e.currentTarget.style.background = '#1447c0'}
            onMouseLeave={e => e.currentTarget.style.background = '#1a56db'}
          >
            {recommendation ? 'Apply Recommendation' : 'Escalate Shipment'}
          </button>
        </div>
      </div>
    </div>
  )
}

function normalise(s) {
  const capFirst = (str) => str ? str.charAt(0) + str.slice(1).toLowerCase() : ''
  const carrierName = s.carrier?.name ?? s.carrier ?? '—'
  const riskLevel = capFirst(s.latestRisk?.level ?? s.riskLevel ?? 'LOW')
  const status = s.status ? s.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—'
  const priority = capFirst(s.priority ?? 'LOW')
  return {
    ...s,
    _numericId: s.id,
    id: s.shipmentCode ?? s.id,
    carrierName, riskLevel, status, priority,
    cargoType: s.cargoType ?? s.cargo_type ?? '—',
    eta: s.estimatedArrival ? new Date(s.estimatedArrival).toLocaleDateString('en-IN') : '—',
    isColdChain: s.isColdChain ?? false,
  }
}

export default function ShipmentsPage() {
  const { data: raw, loading, error, refetch } = useApi('/shipments')
  const shipments = useMemo(() => (raw || []).map(normalise), [raw])
  const [selected, setSelected] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [filters, setFilters] = useState({ risk: '', status: '', carrier: '', coldChain: false })
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return shipments.filter(s => {
      if (filters.risk && s.riskLevel !== filters.risk) return false
      if (filters.status && s.status !== filters.status) return false
      if (filters.carrier && s.carrierName !== filters.carrier) return false
      if (filters.coldChain && !s.isColdChain) return false
      if (search) {
        const q = search.toLowerCase()
        if (!s.id?.toString().toLowerCase().includes(q) && !s.origin?.toLowerCase().includes(q) && !s.destination?.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [shipments, filters, search])

  const carriers = useMemo(() => [...new Set(shipments.map(s => s.carrierName).filter(Boolean))], [shipments])

  if (loading) return <LoadingSpinner size="lg" text="Loading shipments..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const selectStyle = {
    background: '#fff', border: '1px solid #e2e6ed', borderRadius: '6px',
    color: '#475569', fontSize: '12px', padding: '6px 10px', outline: 'none', cursor: 'pointer',
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: '#0f172a' }}>Shipments</h1>
        <p className="text-sm mt-0.5" style={{ color: '#94a3b8' }}>{filtered.length} of {shipments.length} shipments</p>
      </div>

      {/* Filters */}
      <div
        className="flex flex-wrap gap-2 p-3 rounded-lg"
        style={{ background: '#ffffff', border: '1px solid #e2e6ed' }}
      >
        <input
          type="text"
          placeholder="Search ID, origin, destination…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="text-xs rounded-md px-3 py-1.5 outline-none"
          style={{ background: '#f8f9fb', border: '1px solid #e2e6ed', color: '#0f172a', width: '220px' }}
        />
        <select value={filters.risk} onChange={e => setFilters(f => ({ ...f, risk: e.target.value }))} style={selectStyle}>
          <option value="">All Risk Levels</option>
          {['Critical','High','Medium','Low'].map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} style={selectStyle}>
          <option value="">All Statuses</option>
          {['In Transit','At Risk','Critical','Delayed','Delivered','On Hold'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filters.carrier} onChange={e => setFilters(f => ({ ...f, carrier: e.target.value }))} style={selectStyle}>
          <option value="">All Carriers</option>
          {carriers.map(c => <option key={String(c)} value={String(c)}>{String(c)}</option>)}
        </select>
        <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: '#475569' }}>
          <input type="checkbox" checked={filters.coldChain} onChange={e => setFilters(f => ({ ...f, coldChain: e.target.checked }))} />
          Cold Chain Only
        </label>
        {(filters.risk || filters.status || filters.carrier || filters.coldChain || search) && (
          <button
            onClick={() => { setFilters({ risk:'',status:'',carrier:'',coldChain:false }); setSearch('') }}
            className="ml-auto text-xs"
            style={{ color: '#94a3b8' }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState title="No shipments found" description="Try adjusting the filters" />
      ) : (
        <div
          className="rounded-lg overflow-hidden"
          style={{ background: '#ffffff', border: '1px solid #e2e6ed', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fb', borderBottom: '1px solid #e2e6ed' }}>
                  {['Shipment','Origin','Destination','Carrier','Priority','ETA','Risk','Status','Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: '#94a3b8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid #f1f5f9' }}
                    onClick={() => { setSelected(s); setDrawerOpen(true) }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8faff'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: '#1a56db' }}>{String(s.id)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#475569' }}>{s.origin?.split(',')[0]}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#475569' }}>{s.destination?.split(',')[0]}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#475569' }}>{s.carrierName}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold" style={{
                        color: s.priority === 'Critical' ? '#dc2626' : s.priority === 'High' ? '#ea580c' : '#64748b'
                      }}>{String(s.priority)}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono whitespace-nowrap" style={{ color: '#475569' }}>{String(s.eta)}</td>
                    <td className="px-4 py-3"><RiskBadge level={s.riskLevel} /></td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3">
                      <button
                        className="flex items-center gap-1 text-xs font-medium"
                        style={{ color: '#1a56db' }}
                        onClick={e => { e.stopPropagation(); setSelected(s); setDrawerOpen(true) }}
                      >
                        Details <ChevronRight size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ShipmentDrawer shipment={selected} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
