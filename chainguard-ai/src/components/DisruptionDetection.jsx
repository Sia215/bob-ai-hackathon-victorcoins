import React, { useState } from 'react';
import { getRiskBadgeClass } from '../utils/helpers';
import { getDisruptionTypeIcon } from '../utils/helpers';
import { getShipmentsForDisruption } from '../services/disruptionDetection';
import { getRecommendation } from '../services/routeRecommendation';
import { disruptions } from '../data/disruptions';

const SEVERITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export default function DisruptionDetection({ enrichedShipments }) {
  const [selected, setSelected] = useState(null);

  const sorted = [...disruptions].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );

  const affectedShipments = selected
    ? getShipmentsForDisruption(selected.id, enrichedShipments)
    : [];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Disruption Detection</div>
          <div className="page-subtitle">{disruptions.length} active disruptions — click a card to see affected shipments and recommendations</div>
        </div>
      </div>

      {/* Disruption cards */}
      <div className="disruption-cards" style={{ marginBottom: 24 }}>
        {sorted.map((d) => {
          const count = getShipmentsForDisruption(d.id, enrichedShipments).length;
          const isSelected = selected?.id === d.id;
          return (
            <div
              key={d.id}
              className={`disruption-card ${d.severity.toLowerCase()}`}
              style={{
                cursor: 'pointer',
                outline: isSelected ? '2px solid var(--accent)' : 'none',
                outlineOffset: 2,
              }}
              onClick={() => setSelected(isSelected ? null : d)}
            >
              <div className="disruption-card-header">
                <div>
                  <div className="disruption-card-type">
                    {getDisruptionTypeIcon(d.type)} {d.type} · {d.id}
                  </div>
                  <div className="disruption-card-title">{d.title}</div>
                </div>
                <span className={getRiskBadgeClass(d.severity)}>{d.severity}</span>
              </div>
              <div className="disruption-card-desc">{d.description}</div>
              <div className="disruption-card-meta">
                <span>📅 Started: {d.startDate}</span>
                <span>🔚 Est. resolved: {d.estimatedResolution}</span>
                <span>📦 {count} shipment(s) affected</span>
              </div>
              <div style={{ marginTop: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Affected regions: </span>
                <span style={{ fontSize: 11, color: 'var(--text)' }}>{d.affectedRegions.join(', ')}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Affected shipments for selected disruption */}
      {selected && (
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">
                Shipments Affected by: {selected.title}
              </div>
              <div className="section-sub">{affectedShipments.length} shipment(s) impacted</div>
            </div>
          </div>

          {affectedShipments.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No shipments currently linked to this disruption.</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Route</th>
                    <th>Carrier</th>
                    <th>Cargo</th>
                    <th>Status</th>
                    <th>Risk</th>
                    <th>Delay</th>
                    <th>Recommended Action</th>
                    <th>Alternative Route</th>
                    <th>Alt. Carrier</th>
                  </tr>
                </thead>
                <tbody>
                  {affectedShipments.map((s) => {
                    const rec = getRecommendation(s, s.riskLevel);
                    return (
                      <tr key={s.id}>
                        <td className="td-mono">{s.id}</td>
                        <td style={{ fontSize: 12 }}>
                          {s.origin}<br />
                          <span style={{ color: 'var(--text-muted)' }}>→ {s.destination}</span>
                        </td>
                        <td className="td-muted" style={{ fontSize: 12 }}>{s.carrier}</td>
                        <td className="td-muted" style={{ fontSize: 12 }}>{s.cargoType}</td>
                        <td>
                          <span className={
                            s.status === 'Delayed' ? 'badge badge-high' :
                            s.status === 'At Risk' ? 'badge badge-warning' :
                            'badge badge-info'
                          }>{s.status}</span>
                        </td>
                        <td><span className={getRiskBadgeClass(s.riskLevel)}>{s.riskLevel}</span></td>
                        <td style={{ fontSize: 12, color: s.delayDays > 0 ? 'var(--red)' : 'var(--green)' }}>
                          {s.delayDays > 0 ? `+${s.delayDays}d` : 'None'}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--accent)' }}>{rec.action}</td>
                        <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{rec.alternativeRoute || '—'}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rec.alternativeCarrier || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!selected && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Select a disruption card above to view affected shipments and recommendations</div>
        </div>
      )}
    </div>
  );
}
