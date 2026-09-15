import React from 'react';

const NAV_ITEMS = [
  { id: 'dashboard', icon: '◉', label: 'Dashboard' },
  { id: 'shipments', icon: '📦', label: 'Shipments' },
  { id: 'disruptions', icon: '⚡', label: 'Disruptions' },
  { id: 'fleet', icon: '🚛', label: 'Fleet Optimization' },
  { id: 'coldchain', icon: '🌡️', label: 'Cold-Chain Monitor' },
  { id: 'assistant', icon: '🤖', label: 'AI Assistant' },
];

export default function Sidebar({ activePage, onNavigate, badges }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⛓️</div>
        <div className="sidebar-logo-text">
          <span className="name">ChainGuard AI</span>
          <span className="tagline">Supply Chain Intelligence</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {NAV_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`nav-item${activePage === item.id ? ' active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {badges && badges[item.id] ? (
              <span className={`nav-badge${badges[item.id].color ? ' ' + badges[item.id].color : ''}`}>
                {badges[item.id].count}
              </span>
            ) : null}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        Built for IBM Bob Hackathon 2026
      </div>
    </aside>
  );
}
