import { useState, useRef, useEffect } from 'react'
import { apiPost } from '../api/client'
import { Bot, Send, ExternalLink, RefreshCw, CheckCircle, Eye, FlaskConical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const SUGGESTIONS = [
  "What are the most critical shipments right now?",
  "Which fleet assets are idle and should be redeployed?",
  "Summarize cold chain excursions",
  "What disruptions are affecting operations?",
  "Give me today's top 3 priorities",
  "Which carrier has the best performance?",
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

function ActionCard({ action, navigate }) {
  const routeMap = { reroute: '/routes', redeploy: '/fleet', investigate: '/shipments', simulate: '/simulation' }
  return (
    <div className="p-3 rounded-lg bg-[#111827] border border-[#253347] space-y-2">
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
          action.priority === 'Critical' ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
        }`}>{action.type}</span>
        <p className="text-white text-sm font-semibold">{action.title}</p>
      </div>
      <p className="text-slate-400 text-xs">{action.description}</p>
      <div className="flex gap-2">
        {routeMap[action.type?.toLowerCase()] && (
          <button
            onClick={() => navigate(routeMap[action.type.toLowerCase()])}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25"
          >
            <Eye size={11} /> View
          </button>
        )}
        <button
          onClick={() => navigate('/simulation')}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30 hover:bg-purple-500/25"
        >
          <FlaskConical size={11} /> Simulate
        </button>
      </div>
    </div>
  )
}

export default function CopilotPage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Welcome to the CHAINguard AI Command Center. I have full access to your supply chain data. How can I assist you today?', actions: [] }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const content = text || input.trim()
    if (!content) return
    setInput('')
    const userMsg = { role: 'user', content }
    setMessages(m => [...m, userMsg])
    setHistory(h => [content, ...h.slice(0, 4)])
    setLoading(true)
    try {
      const res = await apiPost('/ai/query', { message: content, context: 'full_copilot' })
      const assistantMsg = {
        role: 'assistant',
        content: res.response || res.answer || JSON.stringify(res),
        actions: res.actions || [],
      }
      setMessages(m => [...m, assistantMsg])
    } catch (err) {
      setMessages(m => [...m, {
        role: 'assistant',
        content: `AI service unavailable: ${err.message}`,
        actions: []
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-5">
      {/* Left: History */}
      <div className="w-52 shrink-0 flex flex-col gap-3">
        <div className="rounded-xl border border-[#1e293b] p-4" style={{ background: '#111827' }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Recent Queries</p>
          {history.length === 0 ? (
            <p className="text-slate-600 text-xs">No history yet</p>
          ) : (
            <div className="space-y-2">
              {history.map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)}
                  className="w-full text-left text-xs text-slate-400 hover:text-slate-200 truncate p-2 rounded-lg hover:bg-[#1a2235] transition-colors">
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[#1e293b] p-4" style={{ background: '#111827' }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Quick Ask</p>
          <div className="space-y-1.5">
            {SUGGESTIONS.slice(0, 4).map(s => (
              <button key={s} onClick={() => sendMessage(s)}
                className="w-full text-left text-xs text-slate-400 hover:text-blue-400 p-1.5 rounded transition-colors leading-tight">
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Center: Chat */}
      <div className="flex-1 flex flex-col rounded-xl border border-[#1e293b] overflow-hidden" style={{ background: '#0d1526' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1e293b]" style={{ background: '#111827' }}>
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Bot size={18} className="text-blue-400" />
          </div>
          <div>
            <p className="text-white font-bold">CHAINguard AI Copilot</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs">Connected to live data</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-blue-400" />
                </div>
              )}
              <div className={`max-w-[75%] ${msg.role === 'user' ? '' : 'flex-1'}`}>
                <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-[#1a2235] border border-[#253347] text-slate-200 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                <Bot size={16} className="text-blue-400" />
              </div>
              <div className="bg-[#1a2235] border border-[#253347] rounded-xl rounded-bl-sm">
                <TypingIndicator />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-[#1e293b]" style={{ background: '#111827' }}>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything — shipments, disruptions, fleet, cold chain..."
              className="flex-1 bg-[#1a2235] border border-[#253347] text-slate-200 placeholder-slate-600 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50"
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-11 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center transition-colors"
            >
              <Send size={16} className="text-white" />
            </button>
          </div>
          <div className="flex gap-2 flex-wrap mt-3">
            {SUGGESTIONS.slice(4).map(s => (
              <button key={s} onClick={() => sendMessage(s)}
                className="text-xs px-2.5 py-1 rounded-full bg-[#1a2235] border border-[#253347] text-slate-400 hover:text-slate-200 hover:border-blue-500/40">
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="w-64 shrink-0 rounded-xl border border-[#1e293b] overflow-hidden flex flex-col" style={{ background: '#111827' }}>
        <div className="px-4 py-3 border-b border-[#1e293b]">
          <p className="text-white font-bold text-sm">Actions</p>
          <p className="text-slate-500 text-xs">From last AI response</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {lastAssistant?.actions && lastAssistant.actions.length > 0 ? (
            <div className="space-y-3">
              {lastAssistant.actions.map((action, i) => (
                <ActionCard key={i} action={action} navigate={navigate} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <Bot size={32} className="text-slate-700 mb-3" />
              <p className="text-slate-500 text-xs">Actions will appear here after AI responds</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
