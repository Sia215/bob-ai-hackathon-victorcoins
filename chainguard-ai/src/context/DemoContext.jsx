import { createContext, useContext, useState, useCallback, useRef } from 'react'

export const DemoContext = createContext(null)

export function useDemoMode() {
  return useContext(DemoContext)
}

export function DemoProvider({ children }) {
  const [demoActive, setDemoActive] = useState(false)
  const [demoStep, setDemoStep] = useState(0)
  const [demoHighlights, setDemoHighlights] = useState({})
  const timersRef = useRef([])

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  const startDemo = useCallback((addToast) => {
    clearTimers()
    setDemoActive(true)
    setDemoStep(1)
    setDemoHighlights({})

    addToast('Running disruption demo — Mumbai flood scenario...', 'info', 10000)

    const t1 = setTimeout(() => {
      setDemoStep(2)
      setDemoHighlights(h => ({ ...h, mumbaiFlood: true }))
      addToast('⚠ Mumbai flood disruption activated — 8 shipments at risk', 'warning', 5000)
    }, 1000)

    const t2 = setTimeout(() => {
      setDemoStep(3)
      setDemoHighlights(h => ({ ...h, shipmentsWarning: true }))
      addToast('🚢 Shipments SHP-001, SHP-003, SHP-007 rerouting to warning state', 'warning', 5000)
    }, 3000)

    const t3 = setTimeout(() => {
      setDemoStep(4)
      setDemoHighlights(h => ({ ...h, aiRecommendations: true }))
      addToast('🤖 AI generated 3 mitigation recommendations', 'info', 5000)
    }, 5000)

    const t4 = setTimeout(() => {
      setDemoStep(5)
      setDemoHighlights(h => ({ ...h, coldChainAlert: true }))
      addToast('🌡 Cold-chain alert: SHP-CC-003 temperature rising — 4.2°C', 'error', 5000)
    }, 7000)

    const t5 = setTimeout(() => {
      setDemoStep(6)
      setDemoHighlights(h => ({ ...h, fleetRedeploy: true }))
      addToast('🚛 Fleet redeployment recommended: VH-007 → Chennai port', 'info', 5000)
    }, 9000)

    const t6 = setTimeout(() => {
      setDemoStep(7)
      addToast('✅ Demo complete — all scenarios demonstrated', 'success', 6000)
      setDemoActive(false)
    }, 11000)

    timersRef.current = [t1, t2, t3, t4, t5, t6]
  }, [])

  const stopDemo = useCallback(() => {
    clearTimers()
    setDemoActive(false)
    setDemoStep(0)
    setDemoHighlights({})
  }, [])

  return (
    <DemoContext.Provider value={{ demoActive, demoStep, demoHighlights, startDemo, stopDemo }}>
      {children}
    </DemoContext.Provider>
  )
}
