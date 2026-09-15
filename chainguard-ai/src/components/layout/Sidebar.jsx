import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Globe, Package, AlertTriangle, Truck,
  Thermometer, Route, FlaskConical, BarChart3, Bot, Bell,
  ChevronLeft, ChevronRight
} from 'lucide-react'
import { useApi } from '../../hooks/useApi'

const NAV_ITEMS = [
  { to: '/',            label: 'Overview',       icon: LayoutDashboard },
  { to: '/globe',       label: 'Digital Twin',   icon: Globe },
  { to: '/shipments',   label: 'Shipments',      icon: Package },
  { to: '/disruptions', label: 'Disruptions',    icon: AlertTriangle },
  { to: '/fleet',       label: 'Fleet',          icon: Truck },
  { to: '/cold-chain',  label: 'Cold Chain',     icon: Thermometer },
  { to: '/routes',      label: 'Routes',         icon: Route },
  { to: '/simulation',  label: 'Simulation Lab', icon: FlaskConical },
  { to: '/analytics',   label: 'Analytics',      icon: BarChart3 },
  { to: '/alerts',      label: 'Alerts',         icon: Bell, badge: true },
]

export default function Sidebar({ collapsed, onToggle }) {
  const { data: alerts } = useApi('/alerts')
  const unreadCount = alerts ? alerts.filter(a => !a.read && !a.isRead).length : 0

  return (
    <aside
      className="fixed left-0 top-14 bottom-0 flex flex-col z-40 transition-all duration-200"
      style={{
        width: collapsed ? '52px' : '220px',
        background: '#0d1b2e',
        borderRight: '1px solid #162032',
      }}
    >
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
        {!collapsed && (
          <p
            className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: '#2d4a66', letterSpacing: '.1em' }}
          >
            Navigation
          </p>
        )}
        {NAV_ITEMS.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-2 my-0.5 rounded-md text-[13px] font-medium transition-all duration-150 relative
              ${isActive ? 'text-white' : 'hover:text-white'}`
            }
            style={({ isActive }) =>
              isActive
                ? { background: '#1a3a5c', color: '#fff' }
                : { color: '#7a96b4' }
            }
            onMouseEnter={e => {
              if (!e.currentTarget.classList.contains('text-white') || e.currentTarget.style.background !== '#1a3a5c') {
                e.currentTarget.style.background = 'rgba(255,255,255,.05)'
              }
            }}
            onMouseLeave={e => {
              if (e.currentTarget.style.background !== '#1a3a5c') {
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            <Icon size={15} className="shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
            {!collapsed && badge && unreadCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded min-w-[18px] text-center leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            {collapsed && badge && unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="px-4 py-2" style={{ borderTop: '1px solid #162032' }}>
          <p className="text-[10px] font-mono" style={{ color: '#2d4a66' }}>v1.0 · IBM Hackathon</p>
        </div>
      )}

      <button
        onClick={onToggle}
        className="flex items-center justify-center h-9 transition-colors"
        style={{ borderTop: '1px solid #162032', color: '#2d4a66' }}
        onMouseEnter={e => e.currentTarget.style.color = '#7a96b4'}
        onMouseLeave={e => e.currentTarget.style.color = '#2d4a66'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  )
}
