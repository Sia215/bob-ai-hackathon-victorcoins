import { Search, Bell, Bot, Activity, User, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'

export default function TopBar({ onDemoMode, demoActive }) {
  const navigate = useNavigate()
  const { data: alerts } = useApi('/alerts')
  const unread = alerts ? alerts.filter(a => !a.read && !a.isRead).length : 0

  return (
    <header
      className="fixed top-0 left-0 right-0 h-14 flex items-center px-5 z-50 gap-4"
      style={{ background: '#ffffff', borderBottom: '1px solid #e2e6ed', boxShadow: '0 1px 0 rgba(0,0,0,.04)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 shrink-0" style={{ width: '220px' }}>
        <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: '#1a56db' }}>
          <Activity size={14} className="text-white" />
        </div>
        <div className="leading-none">
          <span className="font-bold text-sm tracking-tight" style={{ color: '#0f172a' }}>ChainGuard</span>
          <span className="font-bold text-sm tracking-tight" style={{ color: '#1a56db' }}> AI</span>
        </div>
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded ml-0.5"
          style={{ background: '#eff6ff', color: '#1a56db', border: '1px solid #bfdbfe', letterSpacing: '.04em' }}
        >
          ENTERPRISE
        </span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Search shipments, routes, disruptions…"
          className="w-full text-sm rounded-md pl-9 pr-4 py-1.5 focus:outline-none transition-all"
          style={{ background: '#f8f9fb', border: '1px solid #e2e6ed', color: '#0f172a' }}
          onFocus={e => { e.target.style.borderColor = '#93c5fd'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,.08)' }}
          onBlur={e => { e.target.style.borderColor = '#e2e6ed'; e.target.style.background = '#f8f9fb'; e.target.style.boxShadow = 'none' }}
        />
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-1.5">
        {/* System status */}
        <div
          className="hidden md:flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium" style={{ color: '#15803d' }}>Systems Online</span>
        </div>

        {/* Demo Mode */}
        <button
          onClick={onDemoMode}
          className="text-xs font-medium px-2.5 py-1.5 rounded-md transition-all"
          style={demoActive
            ? { background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }
            : { background: '#fff', border: '1px solid #e2e6ed', color: '#475569' }
          }
        >
          {demoActive ? '● Demo' : 'Demo'}
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/alerts')}
          className="relative p-2 rounded-md transition-colors"
          style={{ color: '#64748b' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f8f9fb'; e.currentTarget.style.color = '#0f172a' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' }}
          title="Alerts"
        >
          <Bell size={16} />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center leading-none">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {/* AI Copilot */}
        <button
          onClick={() => navigate('/copilot')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
          style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#7c3aed' }}
          onMouseEnter={e => e.currentTarget.style.background = '#ede9fe'}
          onMouseLeave={e => e.currentTarget.style.background = '#f5f3ff'}
        >
          <Bot size={13} />
          AI Copilot
        </button>

        {/* User */}
        <div
          className="flex items-center gap-1.5 pl-2 ml-1 cursor-pointer"
          style={{ borderLeft: '1px solid #e2e6ed' }}
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#1a56db' }}>
            <User size={13} className="text-white" />
          </div>
          <ChevronDown size={12} style={{ color: '#94a3b8' }} />
        </div>
      </div>
    </header>
  )
}
