import React, { useState, useRef, useEffect } from 'react';
import { generateResponse } from '../services/aiAssistant';
import { renderMarkdown } from '../utils/helpers';

const SUGGESTIONS = [
  'Which shipments are at highest risk?',
  'Which shipments are affected by the Mumbai port strike?',
  'Which idle trucks can be redeployed?',
  'Which cold-chain shipments have temperature problems?',
  'What should we prioritize today?',
  'Tell me about shipment S002',
  'Show me all active disruptions',
  'Why is shipment S011 high risk?',
];

const WELCOME_MESSAGE = {
  role: 'assistant',
  text: `Hello! I'm the **ChainGuard AI Logistics Assistant** — powered by your live supply chain data.\n\nI can answer questions about shipments, disruptions, fleet assets, and cold-chain alerts using only real application data.\n\nTry one of the suggested questions below, or ask me anything about your operations.`,
};

export default function AIAssistant({ enrichedShipments, coldChainReadings }) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = (text) => {
    const userText = text || input.trim();
    if (!userText) return;

    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setInput('');
    setIsTyping(true);

    // Simulate slight delay for realism
    setTimeout(() => {
      const response = generateResponse(userText, enrichedShipments, coldChainReadings);
      setMessages((prev) => [...prev, { role: 'assistant', text: response }]);
      setIsTyping(false);
    }, 400);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">AI Logistics Assistant</div>
          <div className="page-subtitle">Answers grounded in live data — zero hallucinations, real shipment intelligence only</div>
        </div>
        <div className="page-header-actions">
          <span style={{ fontSize: 11, color: 'var(--green)', background: 'var(--green-dim)', padding: '4px 12px', borderRadius: 20, border: '1px solid var(--green-mid)', fontWeight: 600 }}>
            ✓ Data-Grounded
          </span>
        </div>
      </div>

      <div className="chat-layout">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-avatar">🤖</div>
          <div className="chat-header-info">
            <div className="title">ChainGuard Intelligence</div>
            <div className="subtitle">Logistics AI · {enrichedShipments.length} shipments · {enrichedShipments.filter(s => s.riskLevel === 'Critical').length} critical · {coldChainReadings.filter(r => r.severity !== 'Normal').length} cold-chain alerts</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--green)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
            Online
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-bubble ${msg.role}`}>
              <div className="chat-bubble-avatar">
                {msg.role === 'assistant' ? '🤖' : 'U'}
              </div>
              <div
                className="chat-bubble-content"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
              />
            </div>
          ))}
          {isTyping && (
            <div className="chat-bubble assistant">
              <div className="chat-bubble-avatar">🤖</div>
              <div className="chat-bubble-content" style={{ color: 'var(--text-muted)' }}>
                Analyzing supply chain data…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        <div className="chat-suggestions">
          {SUGGESTIONS.slice(0, 4).map((s) => (
            <button key={s} className="chat-suggestion-btn" onClick={() => sendMessage(s)}>
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="chat-input-row">
          <input
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about shipments, disruptions, fleet, or cold-chain…"
          />
          <button className="chat-send-btn" onClick={() => sendMessage()}>
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
