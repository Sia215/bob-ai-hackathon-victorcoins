import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import AppShell from './components/layout/AppShell'
import LoadingSpinner from './components/ui/LoadingSpinner'
import ToastContainer from './components/ui/Toast'
import { useToast } from './hooks/useToast'
import { DemoProvider, useDemoMode } from './context/DemoContext'
import CopilotPanel from './components/ai/CopilotPanel'

const DashboardPage   = lazy(() => import('./pages/DashboardPage'))
const ShipmentsPage   = lazy(() => import('./pages/ShipmentsPage'))
const DisruptionsPage = lazy(() => import('./pages/DisruptionsPage'))
const FleetPage       = lazy(() => import('./pages/FleetPage'))
const ColdChainPage   = lazy(() => import('./pages/ColdChainPage'))
const RoutesPage      = lazy(() => import('./pages/RoutesPage'))
const SimulationPage  = lazy(() => import('./pages/SimulationPage'))
const AnalyticsPage   = lazy(() => import('./pages/AnalyticsPage'))
const AlertsPage      = lazy(() => import('./pages/AlertsPage'))
const CopilotPage     = lazy(() => import('./pages/CopilotPage'))
const GlobePage       = lazy(() => import('./pages/GlobePage'))

function AppInner() {
  const { toasts, addToast, removeToast } = useToast()
  const { demoActive, startDemo, stopDemo } = useDemoMode()

  const handleDemoMode = () => {
    if (demoActive) {
      stopDemo()
      addToast('Demo stopped', 'info')
    } else {
      startDemo(addToast)
    }
  }

  return (
    <>
      <AppShell onDemoMode={handleDemoMode} demoActive={demoActive}>
        <Suspense fallback={<LoadingSpinner size="lg" text="Loading page..." />}>
          <Routes>
            <Route path="/"            element={<DashboardPage   />} />
            <Route path="/globe"       element={<GlobePage       />} />
            <Route path="/shipments"   element={<ShipmentsPage   />} />
            <Route path="/disruptions" element={<DisruptionsPage />} />
            <Route path="/fleet"       element={<FleetPage       />} />
            <Route path="/cold-chain"  element={<ColdChainPage   />} />
            <Route path="/routes"      element={<RoutesPage      />} />
            <Route path="/simulation"  element={<SimulationPage  />} />
            <Route path="/analytics"   element={<AnalyticsPage   />} />
            <Route path="/alerts"      element={<AlertsPage      />} />
            <Route path="/copilot"     element={<CopilotPage     />} />
            <Route path="*"            element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppShell>
      <CopilotPanel addToast={addToast} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <DemoProvider>
        <AppInner />
      </DemoProvider>
    </BrowserRouter>
  )
}
