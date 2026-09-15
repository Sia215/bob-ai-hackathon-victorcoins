import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { apiPost } from '../api/client'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorState from '../components/ui/ErrorState'
import RiskBadge from '../components/ui/RiskBadge'
import { FlaskConical, Play, ChevronUp, ChevronDown, Minus } from 'lucide-react'

function SliderControl({ label, value, onChange, min, max, step = 1, unit = '' }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <label className="text-slate-400 font-medium">{label}</label>
        <span className="text-blue-300 font-semibold">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-[#1e293b] accent-blue-500 cursor-pointer"
      />
      <div className="flex justify-between text-xs text-slate-600">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

function DeltaIndicator({ before, after, unit = '', lowerIsBetter = false }) {
  if (before == null || after == null) return <span className="text-slate-500 text-xs">—</span>
  const delta = after - before
  if (delta === 0) return <span className="text-slate-400 text-xs flex items-center gap-0.5"><Minus size={10} /> No change</span>
  const worse = lowerIsBetter ? delta > 0 : delta > 0
  const Icon = delta > 0 ? ChevronUp : ChevronDown
  return (
    <span className={`text-xs flex items-center gap-0.5 font-semibold ${worse ? 'text-red-400' : 'text-green-400'}`}>
      <Icon size={12} /> {Math.abs(delta)}{unit}
    </span>
  )
}

function CompareTable({ baseline, simulated }) {
  if (!baseline || !simulated) return null
  // Keys must match simulationService.js return shape
  const rows = [
    { label: 'Affected Shipments', bKey: 'affectedShipments',  sKey: 'affectedShipments',  unit: '',   lowerIsBetter: true },
    { label: 'Critical Shipments', bKey: 'criticalShipments',  sKey: 'criticalShipments',  unit: '',   lowerIsBetter: true },
    { label: 'Total Delay (hrs)',   bKey: 'totalDelayHours',    sKey: 'totalDelayHours',    unit: 'h',  lowerIsBetter: true },
    { label: 'Cold Chain Alerts',   bKey: 'coldChainAlerts',    sKey: 'coldChainAlerts',    unit: '',   lowerIsBetter: true },
    { label: 'Cargo at Risk (₹)',   bKey: 'cargoValueAtRisk',   sKey: 'cargoValueAtRisk',   unit: '',   lowerIsBetter: true },
  ]
  return (
    <div className="rounded-xl border border-[#1e293b] overflow-hidden" style={{ background: '#111827' }}>
      <div className="grid grid-cols-4 bg-[#1a2235] border-b border-[#1e293b] text-xs font-semibold uppercase tracking-wider text-slate-500">
        <div className="px-4 py-3">Metric</div>
        <div className="px-4 py-3">Baseline</div>
        <div className="px-4 py-3">Simulated</div>
        <div className="px-4 py-3">Delta</div>
      </div>
      {rows.map(row => (
        <div key={row.label} className="grid grid-cols-4 border-b border-[#1e293b] last:border-0 text-sm">
          <div className="px-4 py-3 text-slate-400 text-xs">{row.label}</div>
          <div className="px-4 py-3 text-white font-semibold text-xs">{baseline[row.bKey] ?? '—'}{row.unit}</div>
          <div className="px-4 py-3 text-white font-semibold text-xs">{simulated[row.sKey] ?? '—'}{row.unit}</div>
          <div className="px-4 py-3">
            <DeltaIndicator before={baseline[row.bKey]} after={simulated[row.sKey]} unit={row.unit} lowerIsBetter={row.lowerIsBetter} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SimulationPage() {
  const { data: disruptions } = useApi('/disruptions')
  const { data: dashboard } = useApi('/dashboard')

  const [params, setParams] = useState({
    disruptionId:      '',
    severityMultiplier: 1.0,
    durationHours:     24,
    affectedRadiusKm:  200,
  })
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])

  const baseline = dashboard?.kpis || {}

  const runSimulation = async () => {
    setRunning(true)
    setError(null)
    try {
      // Backend expects: { disruptionId, severityMultiplier, durationHours, affectedRadiusKm }
      const res = await apiPost('/simulation', {
        disruptionId:      params.disruptionId,
        severityMultiplier: params.severityMultiplier,
        durationHours:     params.durationHours,
        affectedRadiusKm:  params.affectedRadiusKm,
      })
      setResult(res)
      setHistory(h => [{ ...params, result: res, timestamp: new Date().toISOString() }, ...h.slice(0, 4)])
    } catch (err) {
      setError(err.message)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Simulation Lab</h1>
        <p className="text-slate-500 text-sm">Model disruption scenarios and assess impact</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Parameters */}
        <div className="space-y-5">
          <div className="rounded-xl border border-[#1e293b] p-5" style={{ background: '#111827' }}>
            <h2 className="text-white font-bold text-sm mb-4">Scenario Parameters</h2>

            {/* Disruption select */}
            <div className="mb-5">
             <label className="text-slate-400 text-xs font-medium block mb-1.5">Select Disruption</label>
             <select
               value={params.disruptionId}
               onChange={e => setParams(p => ({ ...p, disruptionId: e.target.value }))}
               className="w-full bg-[#1a2235] border border-[#253347] text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500/50"
             >
               <option value="">— Select disruption —</option>
               {disruptions?.map(d => (
                 <option key={d.id} value={d.id}>{d.name}</option>
               ))}
             </select>
           </div>

           <div className="space-y-5">
             <SliderControl label="Severity Multiplier" value={params.severityMultiplier} onChange={v => setParams(p => ({...p, severityMultiplier: v}))} min={0.5} max={3.0} step={0.1} />
             <SliderControl label="Duration" value={params.durationHours} onChange={v => setParams(p => ({...p, durationHours: v}))} min={6} max={72} unit="h" />
             <SliderControl label="Affected Radius" value={params.affectedRadiusKm} onChange={v => setParams(p => ({...p, affectedRadiusKm: v}))} min={50} max={500} unit="km" />
           </div>
          </div>

          {/* Run button */}
          <button
            onClick={runSimulation}
            disabled={running || !params.disruptionId}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base transition-all glow-blue"
          >
            {running ? (
              <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Running...</>
            ) : (
              <><Play size={20} fill="white" /> RUN SIMULATION</>
            )}
          </button>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-300 text-sm">{error}</div>
          )}
        </div>

        {/* Center/Right: Results */}
        <div className="xl:col-span-2 space-y-5">
          {result ? (
            <>
              <div className="rounded-xl border border-[#1e293b] p-5" style={{ background: '#111827' }}>
                <h2 className="text-white font-bold text-sm mb-4">Before / After Comparison</h2>
                <CompareTable
                        baseline={result.baseline || {}}
                        simulated={result.simulated || {}}
                      />
              </div>

              {/* AI Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                 <div className="rounded-xl border border-blue-500/30 p-5" style={{ background: 'rgba(59,130,246,0.05)' }}>
                   <h2 className="text-blue-400 font-bold text-sm mb-3">Mitigation Recommendations</h2>
                   <div className="space-y-2">
                     {result.recommendations.map((r, i) => (
                       <div key={i} className="flex items-start gap-2 text-sm text-slate-300 p-3 rounded-lg bg-[#111827] border border-[#1e293b]">
                         <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                         <span>{typeof r === 'string' ? r : r.title || r.action || JSON.stringify(r)}</span>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
            </>
          ) : (
            <div className="rounded-xl border border-[#1e293b] p-12 text-center flex flex-col items-center gap-3"
              style={{ background: '#111827' }}>
              <FlaskConical size={48} className="text-slate-700" />
              <p className="text-slate-500 font-semibold">Configure parameters and run a simulation</p>
              <p className="text-slate-600 text-sm">Select a disruption scenario and adjust the sliders to model different impact scenarios</p>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="rounded-xl border border-[#1e293b] overflow-hidden" style={{ background: '#111827' }}>
              <div className="px-5 py-3 border-b border-[#1e293b]">
                <h2 className="text-white font-bold text-sm">Simulation History</h2>
              </div>
              <div className="divide-y divide-[#1e293b]">
                {history.map((h, i) => (
                  <div key={i} className="px-5 py-3 flex items-center gap-4 text-xs">
                    <span className="text-slate-600 w-28">{new Date(h.timestamp).toLocaleTimeString()}</span>
                    <span className="text-slate-400">×{h.severityMultiplier} severity</span>
                    <span className="text-slate-400">{h.durationHours}h</span>
                    <span className="text-slate-400">{h.affectedRadiusKm}km radius</span>
                    <span className="ml-auto text-green-400">{h.result?.recommendations?.length || 0} recs</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
