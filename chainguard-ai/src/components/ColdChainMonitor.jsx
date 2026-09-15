import React, { useState } from 'react';
import { getColdChainSummary, getRegulatorySeverity } from '../services/coldChainMonitor';
import { getRiskBadgeClass } from '../utils/helpers';

const VERDICT_LABEL = { pass: '✓ Pass', watch: '⚠ Watch', breach: '✗ Breach' };

function RegulatoryPanel({ reading }) {
  const rows = getRegulatorySeverity(reading);
  if (!rows.length) return null;
  return (
    <div className="cc-regulatory">
      <div className="cc-regulatory-label">Regulatory Compliance</div>
      {rows.map((r, i) => (
        <div key={i} className="cc-reg-row">
          <span className="cc-reg-framework">{r.framework}</span>
          <div style={{ textAlign: 'right' }}>
            <span className={`cc-reg-verdict ${r.verdict}`}>{VERDICT_LABEL[r.verdict]}</span>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', maxWidth: 200 }}>{r.note}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ColdChainMonitor({ coldChainReadings }) {
  const summary = getColdChainSummary(coldChainReadings);
  const [filter, setFilter] = useState('All');

  const sorted = [...coldChainReadings].sort((a, b) => {
    const order = { Critical: 0, Warning: 1, Normal: 2 };
    return order[a.severity] - order[b.severity];
  });

  const filtered = filter === 'All' ? sorted : sorted.filter(r => r.severity === filter);

  // Count regulatory breaches
  const regBreaches = coldChainReadings.filter(r => {
    const regs = getRegulatorySeverity(r);
    return regs.some(x => x.verdict === 'breach');
  }).length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Cold-Chain Monitor</div>
          <div className="page-subtitle">Real-time IoT sensor data with regulatory severity classification</div>
        </div>
        <div className="page-header-actions">
          {['All', 'Critical', 'Warning', 'Normal'].map(f => (
            <button
              key={f}
              className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(f)}
            >{f}</button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card accent">
          <div className="kpi-label">Monitored</div>
          <div className="kpi-value accent">{summary.total}</div>
          <div className="kpi-sub">Sensor-equipped shipments</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-label">Critical Excursions</div>
          <div className="kpi-value red">{summary.critical}</div>
          <div className="kpi-sub">Immediate action required</div>
        </div>
        <div className="kpi-card yellow">
          <div className="kpi-label">Warnings</div>
          <div className="kpi-value yellow">{summary.warning}</div>
          <div className="kpi-sub">Monitoring closely</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">Normal</div>
          <div className="kpi-value green">{summary.normal}</div>
          <div className="kpi-sub">Within safe range</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-label">Regulatory Breaches</div>
          <div className="kpi-value red">{regBreaches}</div>
          <div className="kpi-sub">GMP / WHO / FDA / IATA</div>
        </div>
      </div>

      {/* Critical banner */}
      {summary.critical > 0 && (
        <div style={{
          background: 'var(--red-dim)',
          border: '1px solid var(--red-mid)',
          borderRadius: 10,
          padding: '12px 18px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>🚨</span>
          <div>
            <strong style={{ color: 'var(--red)', fontSize: 13 }}>CRITICAL COLD-CHAIN ALERT</strong>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {summary.critical} shipment(s) have critical temperature excursions. Product integrity may be compromised. Regulatory deviation reports required.
            </div>
          </div>
        </div>
      )}

      {/* Sensor cards */}
      <div className="cold-chain-grid">
        {filtered.map((r) => {
          const sev = r.severity.toLowerCase();
          const isExcursion = r.severity !== 'Normal';
          return (
            <div key={r.id} className={`cc-card ${sev}`}>
              <div className="cc-card-header">
                <span className="cc-shipment-id">{r.shipmentId}</span>
                <span className={getRiskBadgeClass(r.severity)}>{r.severity}</span>
              </div>

              <div className="cc-product">{r.product}</div>
              <div className="cc-location">📍 {r.location}</div>

              <div className="cc-temp-row">
                <div className="cc-temp-display">
                  <span className={`cc-temp-value ${sev}`}>
                    {r.currentTemp > 0 ? '+' : ''}{r.currentTemp}
                  </span>
                  <span className="cc-temp-unit">°C</span>
                </div>
                {isExcursion && r.excursionDuration && (
                  <span className={`cc-duration ${sev}`}>
                    ⏱ {r.excursionDuration}
                  </span>
                )}
              </div>

              <div className="cc-safe-range">
                Safe range: <strong>{r.minSafeTemp}°C – {r.maxSafeTemp}°C</strong>
                {isExcursion && (
                  <span style={{ marginLeft: 8, color: r.severity === 'Critical' ? 'var(--red)' : 'var(--yellow)', fontWeight: 600 }}>
                    ({r.currentTemp > r.maxSafeTemp
                      ? `+${(r.currentTemp - r.maxSafeTemp).toFixed(1)}°C over limit`
                      : `${(r.minSafeTemp - r.currentTemp).toFixed(1)}°C below limit`})
                  </span>
                )}
              </div>

              {/* Regulatory panel */}
              <RegulatoryPanel reading={r} />

              <div className="cc-notes">{r.notes}</div>

              <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-dim)', display: 'flex', gap: 10 }}>
                <span>Sensor: {r.id}</span>
                {r.excursionStarted && (
                  <span>· Started: {new Date(r.excursionStarted).toLocaleString()}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
