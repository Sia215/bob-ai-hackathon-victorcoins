import { useState, useMemo } from 'react'
import { useApi } from '../hooks/useApi'
import { apiPatch } from '../api/client'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import { Bell, AlertCircle, AlertTriangle, Info, Truck, Thermometer, Package, Route, CheckCircle, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const SEVERITY_STYLES = {
  Critical: { border: 'border-l-red-500',    bg: 'bg-red-500/5',    icon: AlertCircle,   iconColor: 'text-red-400',    dotColor: 'bg-red-500' },
  High:     { border: 'border-l-orange-500', bg: 'bg-orange-500/5', icon: AlertTriangle, iconColor: 'text-orange-400', dotColor: 'bg-orange-500' },
  Medium:   { border: 'border-l-yellow-500', bg: 'bg-yellow-500/5', icon: AlertTriangle, iconColor: 'text-yellow-400', dotColor: 'bg-yellow-500' },
  Low:      { border: 'border-l-blue-500',   bg: '',                icon: Info,          iconColor: 'text-blue-400',   dotColor: 'bg-blue-500' },
}

const TYPE_ICONS = {
  disruption:   AlertTriangle,
  shipment:     Package,
  fleet:        Truck,
  cold_chain:   Thermometer,
  route:        Route,
}

const TABS = ['All', 'Disruption', 'Shipment Risk', 'Cold Chain', 'Fleet', 'Route']

function AlertItem({ alert, onMarkRead }) {
  const s = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.Low
  const SevIcon = s.icon
  const TypeIcon = TYPE_ICONS[alert.type] || Bell
  const navigate = useNavigate()

  const getEntityLink = () => {
    const t = alert.type?.toLowerCase()
    if (t === 'disruption') return '/disruptions'
    if (t === 'shipment') return '/shipments'
    if (t === 'fleet') return '/fleet'
    if (t === 'cold_chain') return '/cold-chain'
    if (t === 'route') return '/routes'
    return null
  }
  const link = getEntityLink()

  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl border border-[#1e293b] border-l-4 ${s.border} ${s.bg} ${alert.severity === 'Critical' && !alert.read ? 'pulse-red' : ''} transition-all`}
      style={{ background: '#111827' }}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.bg || 'bg-[#1a2235]'}`}>
        <SevIcon size={18} className={s.iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              {!alert.read && <span className={`w-2 h-2 rounded-full ${s.dotColor}`} />}
              <p className={`text-sm font-semibold ${!alert.read ? 'text-white' : 'text-slate-400'}`}>{alert.title}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <TypeIcon size={12} />
              <span className="capitalize">{alert.type?.replace('_', ' ')}</span>
              <span>•</span>
              <span>{new Date(alert.timestamp || alert.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">{alert.message}</p>
        <div className="flex items-center gap-2 mt-2">
          {!alert.read && (
            <button
              onClick={() => onMarkRead(alert.id)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-green-400 transition-colors"
            >
              <CheckCircle size={12} /> Mark Read
            </button>
          )}
          {link && (
            <button
              onClick={() => navigate(link)}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors ml-auto"
            >
              <ExternalLink size={12} /> View
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Normalise a Prisma Notification to the shape the UI expects
function normaliseAlert(a) {
  return {
    ...a,
    read:     a.isRead ?? a.read ?? false,
    severity: toTitle(a.severity),
    type:     a.type?.toLowerCase().replace(/[^a-z_]/g, '_') || 'shipment',
    timestamp: a.createdAt || a.timestamp,
  }
}

function toTitle(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export default function AlertsPage() {
  const { data: alerts, loading, error, refetch } = useApi('/alerts?all=true')
  const [activeTab, setActiveTab] = useState('All')
  const [localAlerts, setLocalAlerts] = useState(null)

  const rawItems = localAlerts ?? alerts ?? []
  const items = rawItems.map(normaliseAlert)

  const filtered = useMemo(() => {
    if (activeTab === 'All') return items
    const tabMap = {
      'Disruption':    'disruption',
      'Shipment Risk': 'shipment',
      'Cold Chain':    'cold_chain',
      'Fleet':         'fleet',
      'Route':         'route',
    }
    return items.filter(a => a.type === tabMap[activeTab])
  }, [items, activeTab])

  const handleMarkRead = async (id) => {
    // Optimistic update using functional updater
    setLocalAlerts(prev => (prev || alerts || []).map(a => a.id === id ? { ...a, isRead: true, read: true } : a))
    try {
      await apiPatch(`/alerts/${id}/read`, {})
    } catch {
      // keep optimistic update
    }
  }

  if (loading) return <LoadingSpinner size="lg" text="Loading alerts..." />
  if (error)   return <ErrorState message={error} onRetry={refetch} />

  const unreadCount = items.filter(a => !a.read).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Alerts</h1>
          <p className="text-slate-500 text-sm">{unreadCount} unread · {items.length} total</p>
        </div>
        {unreadCount > 0 && (
          <span className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold rounded-lg">
            {unreadCount} Unread
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => {
          const tabMap = { 'Disruption': 'disruption', 'Shipment Risk': 'shipment', 'Cold Chain': 'cold_chain', 'Fleet': 'fleet', 'Route': 'route' }
          const count = tab === 'All' ? items.length : items.filter(a => a.type === tabMap[tab]).length
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === tab ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'bg-[#111827] text-slate-400 border border-[#1e293b] hover:text-slate-200'
              }`}
            >
              {tab} <span className="ml-1 text-slate-600">{count}</span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No alerts" description="All clear in this category" icon={Bell} />
      ) : (
        <div className="space-y-3">
          {/* Sort: unread first, then by severity */}
          {[...filtered]
            .sort((a, b) => {
              if (!a.read && b.read) return -1
              if (a.read && !b.read) return 1
              const order = ['Critical','High','Medium','Low']
              return order.indexOf(a.severity) - order.indexOf(b.severity)
            })
            .map(a => (
              <AlertItem key={a.id} alert={a} onMarkRead={handleMarkRead} />
            ))}
        </div>
      )}
    </div>
  )
}
