import React from 'react';
import { getVehicleIcon } from '../utils/helpers';
import { getIdleAssets, getRedeploymentCandidates, getFleetUtilizationStats } from '../services/fleetOptimization';

const STATUS_BADGE = {
  Idle: 'badge badge-warning',
  'In Use': 'badge badge-info',
  Maintenance: 'badge badge-neutral',
  Stranded: 'badge badge-critical',
};

export default function FleetOptimization({ fleetAssets, enrichedShipments }) {
  const stats = getFleetUtilizationStats(fleetAssets);
  const redeployable = getRedeploymentCandidates(fleetAssets, enrichedShipments);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Fleet Optimization</div>
          <div className="page-subtitle">Identify idle assets and generate intelligent redeployment recommendations</div>
        </div>
      </div>

      {/* Fleet Stats */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card accent">
          <div className="kpi-label">Total Assets</div>
          <div className="kpi-value accent">{stats.total}</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">In Use</div>
          <div className="kpi-value green">{stats.inUse}</div>
        </div>
        <div className="kpi-card yellow">
          <div className="kpi-label">Idle / Available</div>
          <div className="kpi-value yellow">{stats.idle}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Maintenance</div>
          <div className="kpi-value">{stats.maintenance}</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-label">Stranded</div>
          <div className="kpi-value red">{stats.stranded}</div>
        </div>
        <div className="kpi-card accent">
          <div className="kpi-label">Utilization Rate</div>
          <div className="kpi-value accent">{Math.round((stats.inUse / stats.total) * 100)}%</div>
          <div className="kpi-sub">{stats.idle} idle, {stats.maintenance} maintenance</div>
        </div>
      </div>

      {/* Redeployment Table */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-header">
          <div>
            <div className="section-title">Redeployment Recommendations</div>
            <div className="section-sub">{stats.idle} idle asset(s) available for immediate dispatch</div>
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Asset ID</th>
                <th>Type</th>
                <th>Location</th>
                <th>Capacity</th>
                <th>Fuel</th>
                <th>Recommended For</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {redeployable.map(({ asset, recommendedFor, reason }) => (
                <tr key={asset.id}>
                  <td className="td-mono">{asset.id}</td>
                  <td>
                    <span style={{ marginRight: 6 }}>{getVehicleIcon(asset.type)}</span>
                    <span style={{ fontSize: 12 }}>{asset.type}</span><br />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{asset.subtype}</span>
                  </td>
                  <td className="td-muted" style={{ fontSize: 12 }}>{asset.currentLocation}</td>
                  <td className="td-muted" style={{ fontSize: 12 }}>{asset.capacity}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 48, height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{ width: `${asset.fuelLevel}%`, height: '100%', background: asset.fuelLevel > 60 ? 'var(--green)' : asset.fuelLevel > 30 ? 'var(--yellow)' : 'var(--red)', borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 11 }}>{asset.fuelLevel}%</span>
                    </div>
                  </td>
                  <td>
                    {recommendedFor ? (
                      <span className="badge badge-info">{recommendedFor.id} — {recommendedFor.cargoType}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>General pool</span>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 220 }}>{reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Fleet Cards */}
      <div className="section-header">
        <div className="section-title">Full Fleet Inventory</div>
      </div>
      <div className="fleet-grid">
        {fleetAssets.map((v) => (
          <div key={v.id} className="fleet-card">
            <div className="fleet-card-header">
              <div>
                <div className="fleet-card-id">{getVehicleIcon(v.type)} {v.id}</div>
                <div className="fleet-card-type">{v.type} · {v.subtype}</div>
              </div>
              <span className={STATUS_BADGE[v.status] || 'badge badge-neutral'}>{v.status}</span>
            </div>
            <div className="fleet-card-row">
              <span>Location</span>
              <span className="val">{v.currentLocation}</span>
            </div>
            <div className="fleet-card-row">
              <span>Capacity</span>
              <span className="val">{v.capacity}</span>
            </div>
            <div className="fleet-card-row">
              <span>Availability</span>
              <span className="val">{v.availability}</span>
            </div>
            <div className="fleet-card-row">
              <span>Operator</span>
              <span className="val">{v.driver}</span>
            </div>
            <div className="fleet-card-row" style={{ border: 'none' }}>
              <span>Last Job</span>
              <span className="val" style={{ fontSize: 11, textAlign: 'right', maxWidth: 140 }}>{v.lastJob}</span>
            </div>
            <div className="fleet-fuel-bar">
              <div className="fleet-fuel-fill" style={{ width: `${v.fuelLevel}%`, background: v.fuelLevel > 60 ? 'var(--green)' : v.fuelLevel > 30 ? 'var(--yellow)' : 'var(--red)' }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>Fuel: {v.fuelLevel}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
