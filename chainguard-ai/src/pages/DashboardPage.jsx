import { useApi } from '../hooks/useApi'
import KpiCard from '../components/ui/KpiCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorState from '../components/ui/ErrorState'
import RiskBadge from '../components/ui/RiskBadge'
import { useNavigate } from 'react-router-dom'
import { useDemoMode } from '../context/DemoContext'
import {
  Package, AlertTriangle, Truck, Thermometer,
  DollarSign, Zap, ChevronRight, Activity, Bot, CheckCircle2
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, Legend
} from 'recharts'

const RISK_COLORS = { Critical: '#dc2626', High: '#ea580c', Medium: '#d97706', Low: '#16a34a' }
const CT = { background: '#fff', border: '1px solid #e2e6ed', borderRadius: 6, fontSize: 11, color: '#0f172a' }
const tickStyle = { fill: '#94a3b8', fontSize: 11 }

function Card({ children, className = '' }) {
  return (
    <div
      className={className}
      style={{ background: '#ffffff', border: '1px solid #e2e6ed', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}
    >
      {children}
    </div>
  )
}

function SectionHeader({ title, subtitle, link, onLink }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="font-semibold text-sm" style={{ color: '#0f172a' }}>{title}</h2>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{subtitle}</p>}
      </div>
      {link && (
        <button onClick={onLink} className="flex items-center gap-1 text-xs font-medium" style={{ color: '#1a56db' }}>
          {link} <ChevronRight size={12} />
        </button>
      )}
    </div>
  )
}

function SeverityDot({ severity }) {
  const colors = { Critical: '#dc2626', High: '#ea580c', Medium: '#d97706', Low: '#16a34a', Info: '#1a56db' }
  return <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: colors[severity] || '#94a3b8' }} />
}

function EventIcon({ type }) {
  const map = {
    disruption: <AlertTriangle size={13} style={{ color: '#dc2626' }} />,
    shipment:   <Package size={13} style={{ color: '#1a56db' }} />,
    fleet:      <Truck size={13} style={{ color: '#d97706' }} />,
    cold_chain: <Thermometer size={13} style={{ color: '#0d9488' }} />,
    alert:      <Zap size={13} style={{ color: '#ea580c' }} />,
  }
  return map[type] || <Activity size={13} style={{ color: '#94a3b8' }} />
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { demoHighlights } = useDemoMode()
  const { data: dashboard, loading, error, refetch } = useApi('/dashboard')
  const { data: events } = useApi('/events')
  const { data: recs } = useApi('/recommendations')
  const { data: disruptions } = useApi('/disruptions')
  const { data: alerts } = useApi('/alerts')

  if (loading) return <LoadingSpinner size="lg" text="Loading dashboard..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const kpis = dashboard?.kpis || {}
  const aiSummary = dashboard?.aiSummary || []
  const riskDist = (dashboard?.riskDistribution || []).map(d => ({
    ...d,
    level: d.level ? (d.level.charAt(0).toUpperCase() + d.level.slice(1).toLowerCase()) : d.level,
  }))
  const fleetUtil = dashboard?.fleetUtilization || []

  const criticalAlerts = alerts
    ? alerts.filter(a => (a.severity === 'CRITICAL' || a.severity === 'Critical') && !(a.isRead ?? a.read))
    : []
  const topRecs = recs ? recs.slice(0, 5) : []
  const recentEvents = events ? events.slice(0, 10) : []

  const rupeeFormat = (v) => {
    if (!v) return '₹0'
    if (v >= 1e7) return `₹${(v/1e7).toFixed(1)}Cr`
    if (v >= 1e5) return `₹${(v/1e5).toFixed(1)}L`
    return `₹${v.toLocaleString('en-IN')}`
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: '#0f172a' }}>Operations Overview</h1>
          <p className="text-sm mt-0.5" style={{ color: '#94a3b8' }}>Real-time supply chain intelligence</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: '#94a3b8' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Live · Updated just now
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard label="Total Shipments"   value={kpis.totalShipments}    icon={Package}       color="blue"   />
        <KpiCard label="At Risk"           value={kpis.atRiskShipments}   icon={AlertTriangle} color="orange" />
        <KpiCard label="Critical"          value={kpis.criticalShipments} icon={Zap}           color="red"    pulse={!!kpis.criticalShipments} />
        <KpiCard label="Active Disruptions" value={kpis.activeDisruptions} icon={AlertTriangle} color="red"   />
        <KpiCard label="Fleet Utilization" value={kpis.fleetUtilization && `${kpis.fleetUtilization}%`} icon={Truck} color="blue" />
        <KpiCard label="Cargo Value at Risk" value={rupeeFormat(kpis.cargoValueAtRisk)} icon={DollarSign} color="purple" />
      </div>

      {/* Critical alert banner */}
      {(criticalAlerts.length > 0 || demoHighlights?.coldChainAlert) && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg"
          style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
        >
          <Zap size={15} style={{ color: '#dc2626', flexShrink: 0 }} />
          <span className="text-sm font-semibold" style={{ color: '#b91c1c' }}>
            {criticalAlerts.length} critical alert{criticalAlerts.length !== 1 ? 's' : ''} require immediate attention
          </span>
          <button
            onClick={() => navigate('/alerts')}
            className="ml-auto flex items-center gap-1 text-xs font-medium"
            style={{ color: '#dc2626' }}
          >
            View Alerts <ChevronRight size={12} />
          </button>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left: Charts */}
        <div className="xl:col-span-2 space-y-5">
          {/* Risk Distribution */}
          <Card className="p-5">
            <SectionHeader title="Risk Distribution" subtitle="Shipments by risk level" link="View All" onLink={() => navigate('/shipments')} />
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskDist} dataKey="count" nameKey="level" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {riskDist.map((entry, i) => (
                      <Cell key={i} fill={RISK_COLORS[entry.level] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CT} />
                  <Legend formatter={(v) => <span style={{ color: '#64748b', fontSize: 11 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Fleet Utilization */}
          <Card className="p-5">
            <SectionHeader title="Fleet Utilization" subtitle="Asset deployment by type" link="Fleet" onLink={() => navigate('/fleet')} />
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fleetUtil} barSize={24}>
                  <XAxis dataKey="type" tick={tickStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={tickStyle} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip contentStyle={CT} />
                  <Bar dataKey="utilization" fill="#1a56db" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Right: AI panels */}
        <div className="space-y-5">
          {/* AI Briefing */}
          <Card className="p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: '#f5f3ff' }}>
                <Bot size={14} style={{ color: '#7c3aed' }} />
              </div>
              <div>
                <h2 className="font-semibold text-sm" style={{ color: '#0f172a' }}>AI Operations Briefing</h2>
                <p className="text-xs" style={{ color: '#94a3b8' }}>Situation summary</p>
              </div>
            </div>
            {aiSummary.length > 0 ? (
              <ul className="space-y-2">
                {aiSummary.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: '#475569' }}>
                    <CheckCircle2 size={13} style={{ color: '#1a56db', flexShrink: 0, marginTop: '1px' }} />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs" style={{ color: '#94a3b8' }}>No briefing available</p>
            )}
          </Card>

          {/* Today's Priorities */}
          <Card className="p-5">
            <SectionHeader title="Today's Priorities" subtitle="Top recommended actions" link="AI Copilot" onLink={() => navigate('/copilot')} />
            {topRecs.length > 0 ? (
              <div className="space-y-0">
                {topRecs.map((rec, i) => (
                  <div
                    key={rec.id || i}
                    className="flex items-start gap-3 py-3"
                    style={{ borderBottom: i < topRecs.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                      style={{
                        background: i === 0 ? '#fef2f2' : i === 1 ? '#fff7ed' : '#eff6ff',
                        color: i === 0 ? '#dc2626' : i === 1 ? '#ea580c' : '#1a56db',
                      }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold truncate" style={{ color: '#0f172a' }}>
                          {rec.title || rec.recommendationType}
                        </span>
                        <RiskBadge level={rec.priority} />
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>{rec.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: '#94a3b8' }}>No recommendations</p>
            )}
          </Card>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Active Disruptions */}
        <Card className="p-5">
          <SectionHeader title="Active Disruptions" subtitle={`${disruptions?.length || 0} active`} link="View All" onLink={() => navigate('/disruptions')} />
          <div className="space-y-2">
            {disruptions?.slice(0, 4).map(d => {
              const sev = d.severity ? (d.severity.charAt(0).toUpperCase() + d.severity.slice(1).toLowerCase()) : 'Low'
              const isHighlighted = demoHighlights?.mumbaiFlood && d.location?.includes('Mumbai')
              return (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{
                    background: isHighlighted ? '#fef2f2' : '#f8f9fb',
                    border: `1px solid ${isHighlighted ? '#fecaca' : '#e2e6ed'}`,
                  }}
                >
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#0f172a' }}>{d.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                      {d.location} · {d.affectedCount ?? d.affectedShipments?.length ?? 0} shipments
                    </p>
                  </div>
                  <RiskBadge level={sev} />
                </div>
              )
            })}
            {(!disruptions || disruptions.length === 0) && <p className="text-xs" style={{ color: '#94a3b8' }}>No active disruptions</p>}
          </div>
        </Card>

        {/* Event Timeline */}
        <Card className="p-5">
          <SectionHeader title="Event Timeline" subtitle="Recent system events" />
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentEvents.map((ev, i) => (
              <div key={ev.id || i} className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0"><EventIcon type={ev.type} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-tight" style={{ color: '#475569' }}>{ev.message}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <SeverityDot severity={ev.severity} />
                    <span className="text-xs" style={{ color: '#94a3b8' }}>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))}
            {recentEvents.length === 0 && <p className="text-xs" style={{ color: '#94a3b8' }}>No events</p>}
          </div>
        </Card>

        {/* Recent Alerts */}
        <Card className="p-5">
          <SectionHeader title="Recent Alerts" subtitle="Unread first" link="All Alerts" onLink={() => navigate('/alerts')} />
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alerts?.slice(0, 6).map(a => {
              const isUnread = !(a.isRead ?? a.read)
              return (
                <div
                  key={a.id}
                  className="flex items-start gap-2.5 p-2 rounded"
                  style={{ background: isUnread ? '#f8f9fb' : 'transparent' }}
                >
                  <SeverityDot severity={a.severity} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium" style={{ color: isUnread ? '#0f172a' : '#94a3b8' }}>{a.title}</p>
                    <p className="text-xs truncate" style={{ color: '#94a3b8' }}>{a.message}</p>
                  </div>
                </div>
              )
            })}
            {(!alerts || alerts.length === 0) && <p className="text-xs" style={{ color: '#94a3b8' }}>No alerts</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
