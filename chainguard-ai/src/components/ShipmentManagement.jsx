import React, { useState } from 'react';
import { getRiskBadgeClass, getStatusBadgeClass } from '../utils/helpers';
import { getRecommendation } from '../services/routeRecommendation';

function RiskBar({ score, level }) {
  return (
    <div className="risk-bar-wrap">
      <div className="risk-bar">
        <div
          className={`risk-bar-fill ${level.toLowerCase()}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="risk-score-num" style={{ color: level === 'Critical' ? 'var(--red)' : level === 'High' ? 'var(--orange)' : level === 'Medium' ? 'var(--yellow)' : 'var(--green)' }}>
        {score}
      </span>
    </div>
  );
}

const ALL = 'All';

export default function ShipmentManagement({ enrichedShipments }) {
  const [filterRisk, setFilterRisk] = useState(ALL);
  const [filterStatus, setFilterStatus] = useState(ALL);
  const [filterCargo, setFilterCargo] = useState(ALL);
  const [filterDisruption, setFilterDisruption] = useState(ALL);
  const [expanded, setExpanded] = useState(null);

  const riskLevels = [ALL, 'Critical', 'High', 'Medium', 'Low'];
  const statuses = [ALL, ...new Set(enrichedShipments.map((s) => s.status))];
  const cargoTypes = [ALL, ...new Set(enrichedShipments.map((s) => s.cargoType))];
  const disruptionIds = [ALL, 'D001', 'D002', 'D003', 'D004', 'D005'];

  const filtered = enrichedShipments.filter((s) => {
    if (filterRisk !== ALL && s.riskLevel !== filterRisk) return false;
    if (filterStatus !== ALL && s.status !== filterStatus) return false;
    if (filterCargo !== ALL && s.cargoType !== filterCargo) return false;
    if (filterDisruption !== ALL && !s.affectedDisruptions.includes(filterDisruption)) return false;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Shipment Management</div>
          <div className="page-subtitle">Monitor and manage all active shipments · click any row to expand details</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <span className="filter-label">Filter by:</span>

        <select className="filter-select" value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)}>
          {riskLevels.map((v) => <option key={v}>{v === ALL ? 'All Risk Levels' : v}</option>)}
        </select>

        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          {statuses.map((v) => <option key={v}>{v === ALL ? 'All Statuses' : v}</option>)}
        </select>

        <select className="filter-select" value={filterCargo} onChange={(e) => setFilterCargo(e.target.value)}>
          {cargoTypes.map((v) => <option key={v}>{v === ALL ? 'All Cargo Types' : v}</option>)}
        </select>

        <select className="filter-select" value={filterDisruption} onChange={(e) => setFilterDisruption(e.target.value)}>
          {disruptionIds.map((v) => <option key={v}>{v === ALL ? 'All Disruptions' : v}</option>)}
        </select>

        <span className="filter-count">{filtered.length} of {enrichedShipments.length} shipments</span>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Origin → Destination</th>
                <th>Carrier</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Cargo Type</th>
                <th>Risk Score</th>
                <th>Risk Level</th>
                <th>Disruptions</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const rec = getRecommendation(s, s.riskLevel);
                const isExpanded = expanded === s.id;
                return (
                  <React.Fragment key={s.id}>
                    <tr
                      onClick={() => setExpanded(isExpanded ? null : s.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="td-mono">{s.id}</td>
                      <td>
                        <div style={{ fontSize: 13 }}>{s.origin}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>→ {s.destination}</div>
                      </td>
                      <td className="td-muted">{s.carrier}</td>
                      <td><span className={getStatusBadgeClass(s.status)}>{s.status}</span></td>
                      <td><span className={getRiskBadgeClass(s.priority)}>{s.priority}</span></td>
                      <td className="td-muted">{s.cargoType}</td>
                      <td style={{ minWidth: 120 }}><RiskBar score={s.riskScore} level={s.riskLevel} /></td>
                      <td><span className={getRiskBadgeClass(s.riskLevel)}>{s.riskLevel}</span></td>
                      <td className="td-muted">{s.affectedDisruptions.length > 0 ? s.affectedDisruptions.join(', ') : '—'}</td>
                      <td>
                        <span style={{ fontSize: 11, color: s.riskLevel === 'Critical' ? 'var(--red)' : s.riskLevel === 'High' ? 'var(--orange)' : 'var(--text-muted)' }}>
                          {rec.action}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={10} style={{ padding: '14px 18px', background: 'var(--bg-card-alt)', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Risk Factors</div>
                              {(s.riskFactors || []).map((f, i) => (
                                <div key={i} style={{ fontSize: 12, color: 'var(--text)', padding: '2px 0' }}>• {f}</div>
                              ))}
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recommendation</div>
                              <div style={{ fontSize: 12, marginBottom: 6 }}>
                                <strong style={{ color: 'var(--text)' }}>Action:</strong> <span style={{ color: 'var(--accent)' }}>{rec.action}</span>
                              </div>
                              {rec.alternativeRoute && (
                                <div style={{ fontSize: 12, marginBottom: 4 }}>
                                  <strong style={{ color: 'var(--text)' }}>Alt Route:</strong> <span style={{ color: 'var(--text-muted)' }}>{rec.alternativeRoute}</span>
                                </div>
                              )}
                              {rec.alternativeCarrier && (
                                <div style={{ fontSize: 12, marginBottom: 4 }}>
                                  <strong style={{ color: 'var(--text)' }}>Alt Carrier:</strong> <span style={{ color: 'var(--text-muted)' }}>{rec.alternativeCarrier}</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Route</div>
                              {s.route.map((r, i) => (
                                <span key={i} style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                  {r}{i < s.route.length - 1 ? ' → ' : ''}
                                </span>
                              ))}
                              {s.delayDays > 0 && (
                                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--red)' }}>
                                  ⚠ Delayed by {s.delayDays} day(s)
                                </div>
                              )}
                            </div>
                          </div>
                          {rec.reason && (
                            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                              <strong style={{ color: 'var(--text)' }}>Why:</strong> {rec.reason}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
