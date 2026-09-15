import { useState, useEffect, useRef } from 'react'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws'

export function useWebSocket() {
  const [lastMessage, setLastMessage] = useState(null)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)
  const reconnectRef = useRef(null)

  const connect = () => {
    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => setConnected(true)

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          setLastMessage(msg)
        } catch {
          // ignore malformed messages
        }
      }

      ws.onclose = () => {
        setConnected(false)
        // Reconnect after 3s
        reconnectRef.current = setTimeout(connect, 3000)
      }

      ws.onerror = () => {
        ws.close()
      }
    } catch {
      // WebSocket not available (SSR or blocked)
      reconnectRef.current = setTimeout(connect, 5000)
    }
  }

  useEffect(() => {
    connect()
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      if (wsRef.current) wsRef.current.close()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { lastMessage, connected }
}
