import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { getRiskBadgeClass, getDisruptionTypeIcon } from '../utils/helpers';

const RISK_COLORS = {
  Critical: '#dc2626',
  High: '#ea580c',
  Medium: '#d97706',
  Low: '#16a34a',
};

function KpiCard({ label, value, valueClass, sub, cardClass }) {
  return (
    <div className={`kpi-card${cardClass ? ' ' + cardClass : ''}`}>
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value${valueClass ? ' ' + valueClass : ''}`}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

export default function Dashboard({ enrichedShipments, disruptions, fleetAssets, coldChainReadings, onNavigate }) {
  const totalShipments    = enrichedShipments.length;
  const activeDisruptions = disruptions.filter((d) => d.status === 'Active').length;
  const criticalShipments = enrichedShipments.filter((s) => s.riskLevel === 'Critical').length;
  const highShipments     = enrichedShipments.filter((s) => s.riskLevel === 'High').length;
  const idleFleet         = fleetAssets.filter((v) => v.status === 'Idle').length;
  const coldAlerts        = coldChainReadings.filter((r) => r.severity === 'Critical' || r.severity === 'Warning').length;
  const coldCritical      = coldChainReadings.filter((r) => r.severity === 'Critical');
  const onTimeRate        = Math.round((enrichedShipments.filter(s => s.status === 'On Time').length / totalShipments) * 100);

  const riskDist = ['Critical', 'High', 'Medium', 'Low'].map((level) => ({
    name: level,
    value: enrichedShipments.filter((s) => s.riskLevel === level).length,
  })).filter((d) => d.value > 0);

  const disruptionBarData = disruptions.map((d) => ({
    name: d.title.length > 20 ? d.title.substring(0, 20) + '…' : d.title,
    shipments: enrichedShipments.filter((s) => s.affectedDisruptions.includes(d.id)).length,
  }));

  const recentAlerts = enrichedShipments
    .filter((s) => s.riskLevel === 'Critical' || s.riskLevel === 'High')
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 6);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Operations Dashboard</div>
          <div className="page-subtitle">Live supply chain intelligence — {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-grid">
        <KpiCard label="Total Shipments"    value={totalShipments}    cardClass="accent" valueClass="accent" sub="Active in network" />
        <KpiCard label="Active Disruptions" value={activeDisruptions} cardClass="red"    valueClass="red"    sub="Require attention" />
        <KpiCard label="Critical Risk"      value={criticalShipments} cardClass="red"    valueClass="red"    sub={`+${highShipments} high risk`} />
        <KpiCard label="Idle Fleet Assets"  value={idleFleet}         cardClass="yellow" valueClass="yellow" sub="Available to redeploy" />
        <KpiCard label="Cold-Chain Alerts"  value={coldAlerts}        cardClass="yellow" valueClass="yellow" sub={`${coldCritical.length} critical excursions`} />
        <KpiCard label="On-Time Rate"       value={`${onTimeRate}%`}  cardClass="green"  valueClass="green"  sub="Shipments on schedule" />
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-title">Risk Distribution</div>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie
                data={riskDist}
                cx="50%" cy="50%"
                innerRadius={58} outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {riskDist.map((entry) => (
                  <Cell key={entry.name} fill={RISK_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #dde1ea', borderRadius: 6, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">Disruption Impact (Affected Shipments)</div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={disruptionBarData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eaedf3" />
              <XAxis dataKey="name" tick={{ fill: '#5a6478', fontSize: 10 }} />
              <YAxis tick={{ fill: '#5a6478', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #dde1ea', borderRadius: 6, fontSize: 12 }} />
              <Bar dataKey="shipments" fill="#1a56db" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom alerts row */}
      <div className="grid-2">
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">High-Risk Shipment Alerts</div>
              <div className="section-sub">{recentAlerts.length} shipments require action</div>
            </div>
            <button className="btn btn-secondary" onClick={() => onNavigate('shipments')}>View All</button>
          </div>
          <div className="alert-list">
            {recentAlerts.map((s) => (
              <div key={s.id} className={`alert-item ${s.riskLevel.toLowerCase()}`}>
                <span className="alert-icon">{s.riskLevel === 'Critical' ? '🔴' : '🟠'}</span>
                <div className="alert-body">
                  <div className="alert-title">{s.id} — {s.origin} → {s.destination}</div>
                  <div className="alert-detail">{s.carrier} · {s.cargoType} · Risk: {s.riskScore}/100 · {s.status}</div>
                </div>
                <span className={getRiskBadgeClass(s.riskLevel)}>{s.riskLevel}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Active Disruptions</div>
              <div className="section-sub">{activeDisruptions} events affecting routes</div>
            </div>
            <button className="btn btn-secondary" onClick={() => onNavigate('disruptions')}>View All</button>
          </div>
          <div className="alert-list">
            {disruptions.map((d) => {
              const count = enrichedShipments.filter((s) => s.affectedDisruptions.includes(d.id)).length;
              return (
                <div key={d.id} className={`alert-item ${d.severity.toLowerCase()}`}>
                  <span className="alert-icon">{getDisruptionTypeIcon(d.type)}</span>
                  <div className="alert-body">
                    <div className="alert-title">{d.title}</div>
                    <div className="alert-detail">{d.type} · {count} shipment(s) affected · Resolves: {d.estimatedResolution}</div>
                  </div>
                  <span className={getRiskBadgeClass(d.severity)}>{d.severity}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
