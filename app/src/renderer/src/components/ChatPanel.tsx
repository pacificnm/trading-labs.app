import { useCallback, useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowUp, Square, Plus, History, Sparkles, User, Trash2, ChevronRight, AlertCircle, KeyRound, Loader2, Check, X, Wrench } from 'lucide-react'
import Picker from './Picker'
import { toast } from '../toast'
import { DEFAULT_PREFS, EFFORTS, MODELS, modelInfo, normalizePrefs, type ChatEvent, type ChatSummary, type Effort, type KeyStatus } from '../../../shared/chat'
import { toolLabel } from '../../../shared/tools'

type Part =
  | { type: 'text'; text: string }
  | { type: 'thinking'; text: string }
  | { type: 'tool'; id: string; name: string; input: unknown; status: 'running' | 'ok' | 'error'; result?: string }

interface Msg {
  role: 'user' | 'assistant'
  parts: Part[]
  meta?: string
  error?: string
  authError?: boolean
  streaming?: boolean
}

/** Appends streamed text to the trailing part of the same kind, or starts a new one. */
function addStreamed(parts: Part[], type: 'text' | 'thinking', text: string): Part[] {
  const last = parts[parts.length - 1]
  if (last && last.type === type) return [...parts.slice(0, -1), { type, text: last.text + text }]
  return [...parts, { type, text }]
}

function toolArg(input: unknown): string {
  if (!input || typeof input !== 'object') return ''
  const o = input as Record<string, unknown>
  const bits = [o.symbol, o.study, o.label, o.price !== undefined ? `@ ${o.price}` : null, o.range, o.interval, o.count !== undefined ? `${o.count} bars` : null].filter((x) => x !== undefined && x !== null)
  return bits.join(' ')
}

interface Prefs { model: string; effort: Effort }

export default function ChatPanel({ context, symbol, externalPrompt, onOpenSettings }: { context: unknown; symbol: string; externalPrompt: { text: string; n: number } | null; onOpenSettings: () => void }) {
  const [chatId, setChatId] = useState<string>(() => crypto.randomUUID())
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS)
  const [history, setHistory] = useState<ChatSummary[] | null>(null)
  const [key, setKey] = useState<KeyStatus | null>(null)
  const requestId = useRef<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const stick = useRef(true)
  const histRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // the default comes from Settings; the picker below overrides it for this session only
    window.api.getSetting('chatDefaults').then((p) => setPrefs(normalizePrefs(p)))
    const onDefaults = (e: Event) => setPrefs(normalizePrefs((e as CustomEvent).detail))
    window.addEventListener('chat-defaults-changed', onDefaults)
    window.api.chat.keyStatus().then(setKey)
    return () => window.removeEventListener('chat-defaults-changed', onDefaults)
  }, [])

  const patchLast = useCallback((fn: (m: Msg) => Msg) => setMessages((ms) => ms.map((m, i) => (i === ms.length - 1 ? fn(m) : m))), [])

  useEffect(() => window.api.chat.onEvent((e: ChatEvent) => {
    if (e.requestId !== requestId.current) return
    if (e.type === 'text') patchLast((m) => ({ ...m, parts: addStreamed(m.parts, 'text', e.text) }))
    else if (e.type === 'thinking') patchLast((m) => ({ ...m, parts: addStreamed(m.parts, 'thinking', e.text) }))
    else if (e.type === 'tool_start') patchLast((m) => ({ ...m, parts: [...m.parts, { type: 'tool', id: e.id, name: e.name, input: e.input, status: 'running' }] }))
    else if (e.type === 'tool_end') patchLast((m) => ({ ...m, parts: m.parts.map((p) => (p.type === 'tool' && p.id === e.id ? { ...p, status: e.ok ? 'ok' : 'error', result: e.result } : p)) }))
    else if (e.type === 'error') { patchLast((m) => ({ ...m, streaming: false, error: e.message, authError: e.code === 'auth' })); setBusy(false); window.api.chat.keyStatus().then(setKey) }
    else {
      const note = e.stopReason === 'refusal' ? ' · declined' : e.stopReason === 'max_tokens' ? ' · cut off (length limit)' : e.stopReason === 'stopped' ? ' · stopped' : ''
      const served = MODELS.find((m) => m.id === e.model)?.label ?? e.model
      patchLast((m) => ({ ...m, streaming: false, parts: m.parts.map((p) => (p.type === 'tool' && p.status === 'running' ? { ...p, status: 'error' as const, result: 'Stopped' } : p)), meta: `${served}${e.outputTokens ? ` · ${e.outputTokens.toLocaleString()} tokens` : ''}${note}` }))
      setBusy(false)
    }
  }), [patchLast])

  useEffect(() => {
    const el = listRef.current
    if (el && stick.current) el.scrollTop = el.scrollHeight
  }, [messages])

  useEffect(() => {
    if (!history) return
    const away = (e: MouseEvent) => !histRef.current?.contains(e.target as Node) && setHistory(null)
    document.addEventListener('mousedown', away)
    return () => document.removeEventListener('mousedown', away)
  }, [history])

  const savePrefs = (p: Prefs) => setPrefs(p)
  const info = modelInfo(prefs.model)

  const send = async (text = input) => {
    text = text.trim()
    if (!text || busy) return
    setInput('')
    stick.current = true
    const id = crypto.randomUUID()
    requestId.current = id
    setBusy(true)
    setMessages((ms) => [...ms, { role: 'user', parts: [{ type: 'text', text }] }, { role: 'assistant', parts: [], streaming: true }])
    await window.api.chat.send({ requestId: id, chatId, model: prefs.model, effort: prefs.effort, text, context })
  }

  // another part of the app (e.g. the journal's "Ask Claude to review") can send a message for the user
  useEffect(() => { if (externalPrompt) { if (busy) toast.warning('Claude is still answering. Try again in a moment.'); else send(externalPrompt.text) } }, [externalPrompt?.n])

  const stop = () => requestId.current && window.api.chat.stop(requestId.current)

  const newChat = () => {
    if (busy) stop()
    requestId.current = null
    setBusy(false)
    setChatId(crypto.randomUUID())
    setMessages([])
    setHistory(null)
  }

  const openHistory = async () => (history ? setHistory(null) : setHistory(await window.api.chat.list()))
  const loadChat = async (c: ChatSummary) => {
    if (busy) stop()
    requestId.current = null
    setBusy(false)
    const rows = await window.api.chat.get(c.id)
    setChatId(c.id)
    setMessages(rows.map((r) => ({ role: r.role, parts: [{ type: 'text' as const, text: r.content }] })))
    stick.current = true
    setHistory(null)
  }

  const suggestions = [
    `Walk me through the ${symbol} chart setup`,
    'What do my active studies say right now?',
    'Explain RSI and how to read it',
    'Help me size a paper trade with proper risk'
  ]

  return (
    <div className="col chat">
      <div className="pane-title">
        <Sparkles size={14} /> <span>Claude</span>
        <span className="spacer" />
        <button className="title-btn" title="New chat" onClick={newChat}><Plus size={15} /></button>
        <div className="title-menu" ref={histRef}>
          <button className={'title-btn' + (history ? ' active' : '')} title="Chat history" onClick={openHistory}><History size={15} /></button>
          {history && (
            <div className="dropdown right hist">
              {history.length === 0 && <div className="muted pad">No saved chats yet</div>}
              {history.map((c) => (
                <div key={c.id} className={'hist-row' + (c.id === chatId ? ' cur' : '')} onClick={() => loadChat(c)}>
                  <span className="hist-title">{c.title}</span>
                  <button title="Delete" onClick={(e) => { e.stopPropagation(); window.api.chat.remove(c.id).then(() => { setHistory(history.filter((h) => h.id !== c.id)); if (c.id === chatId) newChat() }) }}><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="chat-list" ref={listRef} onScroll={(e) => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40 }}>
        {messages.length === 0 ? (
          <div className="chat-empty">
            <Sparkles size={28} strokeWidth={1.25} />
            <h2>Ask Claude</h2>
            <p className="muted">About charts, indicators, trade ideas and risk. Claude sees what you have open.</p>
            {key?.source === 'none' && (
              <button className="notice" onClick={onOpenSettings}><KeyRound size={14} /> Add your Anthropic API key to start chatting</button>
            )}
            <div className="chips">{suggestions.map((s) => <button key={s} onClick={() => send(s)}>{s}</button>)}</div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={'msg ' + m.role}>
              <div className="msg-head">
                {m.role === 'user' ? <><User size={13} /> You</> : <><Sparkles size={13} /> Claude</>}
              </div>
              {m.role === 'user'
                ? <div className="msg-body user-text">{m.parts.map((p) => (p.type === 'text' ? p.text : '')).join('')}</div>
                : (
                  <div className="msg-body">
                    {m.parts.map((p, k) => {
                      const last = k === m.parts.length - 1
                      if (p.type === 'thinking') return (
                        <details key={k} className="thinking" open={m.streaming && last}>
                          <summary><ChevronRight size={12} /> {m.streaming && last ? 'Thinking…' : 'Thought process'}</summary>
                          <div>{p.text}</div>
                        </details>
                      )
                      if (p.type === 'tool') return (
                        <details key={k} className={'tool ' + p.status}>
                          <summary>
                            {p.status === 'running' ? <Loader2 size={13} className="spin" /> : p.status === 'ok' ? <Check size={13} /> : <X size={13} />}
                            <Wrench size={12} className="wrench" /> <b>{toolLabel(p.name)}</b> <span className="tool-arg">{toolArg(p.input)}</span>
                          </summary>
                          <pre>{JSON.stringify(p.input, null, 1)}</pre>
                          {p.result && <pre className="tool-result">{p.result}</pre>}
                        </details>
                      )
                      return (
                        <div key={k} className="md">
                          <Markdown remarkPlugins={[remarkGfm]}>{p.text}</Markdown>
                          {m.streaming && last && <span className="cursor" />}
                        </div>
                      )
                    })}
                    {m.streaming && m.parts.length === 0 && <span className="dots">Working…</span>}
                    {m.streaming && m.parts.length > 0 && m.parts[m.parts.length - 1].type === 'tool' && (m.parts[m.parts.length - 1] as { status: string }).status !== 'running' && <span className="dots">Working…</span>}
                  </div>
                )}
              {m.error && (
                <div className="msg-error"><AlertCircle size={14} /> <span>{m.error}</span>
                  {m.authError && <button onClick={onOpenSettings}>Open Settings</button>}
                </div>
              )}
              {m.meta && <div className="msg-meta">{m.meta}</div>}
            </div>
          ))
        )}
      </div>

      <div className="chat-input">
        <textarea
          rows={1}
          placeholder="Ask Claude…  (Enter to send, Shift+Enter for a new line)"
          value={input}
          onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px' }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send().then(() => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto' }) } }}
        />
        <div className="chat-tools">
          <Picker title="Model" value={prefs.model}
            options={MODELS.map((m) => ({ id: m.id, label: m.label, desc: m.desc }))}
            onChange={(id) => { const m = modelInfo(id); savePrefs({ model: id, effort: m.defaultEffort }) }} />
          <Picker title="Effort: how much Claude thinks before answering" prefix="Effort" value={prefs.effort} disabled={!info.reasoning}
            options={EFFORTS.map((e) => ({ id: e.id, label: e.label, desc: e.desc }))}
            onChange={(id) => savePrefs({ ...prefs, effort: id as Effort })} />
          <span className="spacer" />
          {busy
            ? <button className="send stop" title="Stop" onClick={stop}><Square size={13} fill="currentColor" /></button>
            : <button className="send" title="Send" disabled={!input.trim()} onClick={() => send()}><ArrowUp size={16} /></button>}
        </div>
      </div>
    </div>
  )
}
