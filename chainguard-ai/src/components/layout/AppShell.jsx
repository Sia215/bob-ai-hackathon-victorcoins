import { useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppShell({ children, onDemoMode, demoActive }) {
  const [collapsed, setCollapsed] = useState(false)
  const sidebarWidth = collapsed ? 52 : 220

  return (
    <div className="min-h-screen" style={{ background: '#f0f2f5' }}>
      <TopBar onDemoMode={onDemoMode} demoActive={demoActive} />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <main
        className="pt-14 min-h-screen transition-all duration-200"
        style={{ marginLeft: sidebarWidth }}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
