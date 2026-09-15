import { useApi } from '../hooks/useApi'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorState from '../components/ui/ErrorState'
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts'

const RISK_COLORS = { Critical: '#dc2626', High: '#ea580c', Medium: '#d97706', Low: '#16a34a' }
const CT = { background: '#fff', border: '1px solid #e2e6ed', borderRadius: 6, fontSize: 11, color: '#0f172a', boxShadow: '0 2px 8px rgba(0,0,0,.08)' }
const tickStyle = { fill: '#94a3b8', fontSize: 11 }

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="card p-5">
      <div className="mb-4">
        <h3 className="section-title">{title}</h3>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export default function AnalyticsPage() {
  const { data: shipments,   loading: sl, error: se } = useApi('/shipments')
  const { data: fleetData,   loading: fl, error: fe } = useApi('/fleet')
  const { data: coldChain,   loading: cl, error: ce } = useApi('/cold-chain')
  const { data: disruptions, loading: dl, error: de } = useApi('/disruptions')

  if (sl || fl || cl || dl) return <LoadingSpinner size="lg" text="Loading analytics..." />
  if (se || fe || ce || de) return <ErrorState message={se || fe || ce || de} />

  const fleetAssets   = Array.isArray(fleetData) ? fleetData : (fleetData?.assets   || [])
  const ccShipments   = Array.isArray(coldChain)  ? coldChain : (coldChain?.shipments || [])
  const shipmentList  = shipments || []
  const disruptionList = disruptions || []

  const normLevel  = (l) => l ? l.charAt(0) + l.slice(1).toLowerCase() : 'Unknown'
  const normStatus = (s) => s ? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Unknown'

  const riskDist = Object.entries(
    shipmentList.reduce((acc, s) => {
      const lvl = normLevel(s.latestRisk?.level || s.riskLevel || 'LOW')
      acc[lvl] = (acc[lvl] || 0) + 1
      return acc
    }, {})
  )
    .map(([level, count]) => ({ level, count }))
    .sort((a, b) => ['Critical','High','Medium','Low'].indexOf(a.level) - ['Critical','High','Medium','Low'].indexOf(b.level))

  const statusData = Object.entries(
    shipmentList.reduce((acc, s) => {
      const st = normStatus(s.status)
      acc[st] = (acc[st] || 0) + 1
      return acc
    }, {})
  ).map(([status, count]) => ({ status, count }))

  const fleetByType = Object.entries(
    fleetAssets.reduce((acc, a) => {
      const t = (a.assetType || a.type || 'Other').toLowerCase()
      const label = t.charAt(0).toUpperCase() + t.slice(1)
      if (!acc[label]) acc[label] = { type: label, active: 0, idle: 0, maintenance: 0 }
      const st = (a.status || '').toUpperCase()
      if (st === 'ACTIVE')      acc[label].active++
      else if (st === 'IDLE')   acc[label].idle++
      else                      acc[label].maintenance++
      return acc
    }, {})
  ).map(([, v]) => v)

  const coldTrendMap = ccShipments.reduce((acc, s) => {
    const date = (s.updatedAt || s.lastUpdated || '').split('T')[0] || 'Unknown'
    if (!acc[date]) acc[date] = { date, critical: 0, warning: 0, normal: 0 }
    const alerts = s.activeAlerts || []
    const r = s.latestReading
    const isExcursion = r && (r.temperature > r.safeMaxTemp || r.temperature < r.safeMinTemp)
    const isCritical  = isExcursion && alerts.some(a => a.severity === 'CRITICAL')
    const key = isCritical ? 'critical' : isExcursion ? 'warning' : 'normal'
    acc[date][key]++
    return acc
  }, {})
  const coldTrendData = Object.values(coldTrendMap).sort((a, b) => a.date.localeCompare(b.date))

  const disruByType = Object.entries(
    disruptionList.reduce((acc, d) => {
      const t = d.type || 'Other'
      if (!acc[t]) acc[t] = { type: t, affected: 0, critical: 0 }
      acc[t].affected += d.affectedCount ?? d.affectedShipments?.length ?? 0
      if ((d.severity || '').toUpperCase() === 'CRITICAL') acc[t].critical++
      return acc
    }, {})
  ).map(([, v]) => v)

  const carrierData = Object.values(
    shipmentList.reduce((acc, s) => {
      const name = s.carrier?.name || 'Unknown'
      if (!acc[name]) acc[name] = { name, total: 0, onTime: 0, delayed: 0 }
      acc[name].total++
      const st  = (s.status || '').toUpperCase()
      const lvl = (s.latestRisk?.level || s.riskLevel || '').toUpperCase()
      if (st === 'DELAYED' || lvl === 'CRITICAL' || lvl === 'HIGH') acc[name].delayed++
      else acc[name].onTime++
      return acc
    }, {})
  )
    .map(c => ({ ...c, onTimeRate: c.total > 0 ? Math.round((c.onTime / c.total) * 100) : 0 }))
    .sort((a, b) => b.onTimeRate - a.onTimeRate)
    .slice(0, 8)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Data-driven supply chain insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* 1. Risk Distribution */}
        <ChartCard title="Risk Distribution" subtitle="Shipments by risk level">
          <div className="h-52">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={riskDist} dataKey="count" nameKey="level" cx="50%" cy="50%" outerRadius={75} paddingAngle={3}>
                  {riskDist.map((e, i) => <Cell key={i} fill={RISK_COLORS[e.level] || '#94a3b8'} />)}
                </Pie>
                <Tooltip contentStyle={CT} />
                <Legend formatter={v => <span style={{ color: '#64748b', fontSize: 11 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* 2. Shipment Status */}
        <ChartCard title="Shipment Status" subtitle="Current status breakdown">
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={statusData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf1" />
                <XAxis dataKey="status" tick={{ ...tickStyle, angle: -20 }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CT} />
                <Bar dataKey="count" fill="#1a56db" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* 3. Fleet by Type */}
        <ChartCard title="Fleet by Type" subtitle="Asset status distribution">
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={fleetByType} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf1" />
                <XAxis dataKey="type" tick={tickStyle} axisLine={false} tickLine={false} />
                <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CT} />
                <Legend formatter={v => <span style={{ color: '#64748b', fontSize: 11 }}>{v}</span>} />
                <Bar dataKey="active"      fill="#16a34a" stackId="a" />
                <Bar dataKey="idle"        fill="#d97706" stackId="a" />
                <Bar dataKey="maintenance" fill="#ea580c" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* 4. Cold Chain Trend */}
        <ChartCard title="Cold Chain Excursions" subtitle="Temperature breach trend">
          <div className="h-52">
            <ResponsiveContainer>
              <LineChart data={coldTrendData.length > 0 ? coldTrendData : [{ date: 'No data', critical: 0, warning: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf1" />
                <XAxis dataKey="date" tick={tickStyle} axisLine={false} tickLine={false} />
                <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CT} />
                <Legend formatter={v => <span style={{ color: '#64748b', fontSize: 11 }}>{v}</span>} />
                <Line type="monotone" dataKey="critical" stroke="#dc2626" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="warning"  stroke="#d97706" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="normal"   stroke="#16a34a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* 5. Disruption Impact */}
        <ChartCard title="Disruption Impact" subtitle="Affected shipments by type">
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={disruByType} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf1" />
                <XAxis dataKey="type" tick={tickStyle} axisLine={false} tickLine={false} />
                <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CT} />
                <Legend formatter={v => <span style={{ color: '#64748b', fontSize: 11 }}>{v}</span>} />
                <Bar dataKey="affected" fill="#dc2626" stackId="a" name="Affected" />
                <Bar dataKey="critical" fill="#ea580c" stackId="a" radius={[4, 4, 0, 0]} name="Critical" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* 6. Carrier Performance */}
        <ChartCard title="Carrier On-Time Rate" subtitle="Performance by carrier">
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={carrierData} layout="vertical" barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf1" />
                <XAxis type="number" domain={[0, 100]} tick={tickStyle} unit="%" axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ ...tickStyle, fontSize: 10 }} width={80} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CT} formatter={(v) => [`${v}%`, 'On-Time Rate']} />
                <Bar dataKey="onTimeRate" fill="#16a34a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
