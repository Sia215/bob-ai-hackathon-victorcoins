import { useState, useRef, useEffect } from 'react'
import { apiPost } from '../../api/client'
import { Bot, X, Send, Minimize2, Maximize2 } from 'lucide-react'

const SUGGESTIONS = [
  "What's critical right now?",
  "Show idle fleet assets",
  "Cold chain issues?",
  "Prioritize today's actions",
]

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <span className="typing-dot w-2 h-2 rounded-full bg-slate-500 inline-block" />
      <span className="typing-dot w-2 h-2 rounded-full bg-slate-500 inline-block" />
      <span className="typing-dot w-2 h-2 rounded-full bg-slate-500 inline-block" />
    </div>
  )
}

export default function CopilotPanel({ addToast }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your CHAINguard AI copilot. I can help you analyze shipment risks, disruptions, fleet status, and cold-chain alerts. What would you like to know?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  const sendMessage = async (text) => {
    const content = text || input.trim()
    if (!content) return
    setInput('')
    setMessages(m => [...m, { role: 'user', content }])
    setLoading(true)
    try {
      const res = await apiPost('/ai/query', { message: content, context: 'supply_chain_ops' })
      setMessages(m => [...m, { role: 'assistant', content: res.response || res.answer || JSON.stringify(res) }])
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', content: `I'm having trouble connecting to the AI service. Error: ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[8500] w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center shadow-2xl glow-blue transition-all hover:scale-105"
        >
          <Bot size={24} className="text-white" />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-[8500] flex flex-col rounded-2xl border border-[#253347] shadow-2xl overflow-hidden"
          style={{ width: 380, height: 520, background: '#0d1526' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e293b]" style={{ background: '#111827' }}>
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Bot size={16} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">AI Copilot</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-xs">Online</span>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-200">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ background: '#0a0f1e' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-[#1a2235] border border-[#253347] text-slate-200 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#1a2235] border border-[#253347] rounded-xl rounded-bl-sm">
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestion chips */}
          <div className="px-4 py-2 border-t border-[#1e293b] flex gap-1.5 flex-wrap" style={{ background: '#111827' }}>
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs px-2.5 py-1 rounded-full bg-[#1a2235] border border-[#253347] text-slate-400 hover:text-slate-200 hover:border-blue-500/40 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-[#1e293b]" style={{ background: '#111827' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything about your supply chain..."
              className="flex-1 bg-[#1a2235] border border-[#253347] text-slate-200 placeholder-slate-600 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500/50"
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center transition-colors"
            >
              <Send size={14} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
