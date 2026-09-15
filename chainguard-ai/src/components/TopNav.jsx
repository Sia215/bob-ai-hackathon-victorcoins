import React from 'react';

const NAV_ITEMS = [
  { id: 'dashboard',   icon: '◉',  label: 'Dashboard' },
  { id: 'shipments',   icon: '📦', label: 'Shipments' },
  { id: 'disruptions', icon: '⚡', label: 'Disruptions' },
  { id: 'fleet',       icon: '🚛', label: 'Fleet' },
  { id: 'coldchain',   icon: '🌡️', label: 'Cold-Chain' },
  { id: 'assistant',   icon: '🤖', label: 'AI Assistant' },
];

export default function TopNav({ activePage, onNavigate, badges, criticalCount, disruptionCount }) {
  return (
    <nav className="topnav">
      {/* Brand */}
      <div className="topnav-brand">
        <div className="topnav-brand-icon">⛓️</div>
        <div className="topnav-brand-name">
          ChainGuard AI
          <span>Supply Chain Intelligence</span>
        </div>
      </div>

      {/* Nav links */}
      <div className="topnav-links">
        {NAV_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`topnav-link${activePage === item.id ? ' active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {badges && badges[item.id] ? (
              <span className={`topnav-badge${badges[item.id].color ? ' ' + badges[item.id].color : ''}`}>
                {badges[item.id].count}
              </span>
            ) : null}
          </div>
        ))}
      </div>

      {/* Right side */}
      <div className="topnav-right">
        {criticalCount > 0 && (
          <div className="topnav-alert-chip">
            🔴 {criticalCount} Critical
          </div>
        )}
        <div className="topnav-status">
          <span className="topnav-status-dot" />
          Live · {new Date().toLocaleTimeString()}
        </div>
      </div>
    </nav>
  );
}
