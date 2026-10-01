import Anthropic from '@anthropic-ai/sdk'
import { ipcMain, type WebContents } from 'electron'
import type { Secrets } from './secrets'
import { TOOLS } from '../shared/tools'
import { isMarketOpen, nyParts } from '../shared/nytime'
import type { FmpMcp } from './fmpMcp'
import type { DatabaseSync } from 'node:sqlite'
import { readCaps } from './capsStore'
import { TOOL_CAPS, missingAll, planNote } from '../shared/fmpCaps'
import { SYSTEM_PROMPT, modelInfo, type ChatEvent, type SendRequest } from '../shared/chat'

type EventBody<E = ChatEvent> = E extends unknown ? Omit<E, 'requestId'> : never
const KEY_SETTING = 'anthropic_key'
const inflight = new Map<string, AbortController>()

// Tools run in the renderer (that is where the chart lives); main waits for the reply.
type ToolContent = string | Anthropic.Beta.BetaToolResultBlockParam['content']
interface ToolReply { ok: boolean; text: string; image?: string }
const pendingTools = new Map<string, (r: ToolReply) => void>()
const MAX_TOOL_ROUNDS = 25
// Above this many FMP tools, send them deferred behind Anthropic's tool search instead of all up front.
const MAX_UPFRONT_MCP_TOOLS = 25
const TOOL_PARAMS = TOOLS.map(({ name, description, input_schema }) => ({ name, description, input_schema })) as Anthropic.Beta.BetaTool[]

function callTool(wc: WebContents, name: string, input: unknown, signal: AbortSignal): Promise<ToolReply> {
  return new Promise((resolve) => {
    const callId = crypto.randomUUID()
    const done = (r: ToolReply) => { clearTimeout(timer); signal.removeEventListener('abort', onAbort); pendingTools.delete(callId); resolve(r) }
    const timer = setTimeout(() => done({ ok: false, text: `Tool "${name}" timed out.` }), 60_000)
    const onAbort = () => done({ ok: false, text: 'Cancelled by the user.' })
    signal.addEventListener('abort', onAbort)
    pendingTools.set(callId, done)
    if (wc.isDestroyed()) done({ ok: false, text: 'The app window is closed.' })
    else wc.send('tool:call', { callId, name, input })
  })
}

export function registerChat(db: DatabaseSync, secrets: Secrets, mcp: FmpMcp): void {
  const readKey = (): string | null => secrets.get(KEY_SETTING)

  // With no stored key the SDK falls back to ANTHROPIC_API_KEY / an `ant auth login` profile.
  let cached: { key: string | null; client: Anthropic } | null = null
  const getClient = (): Anthropic => {
    const key = readKey()
    if (!cached || cached.key !== key) cached = { key, client: key ? new Anthropic({ apiKey: key }) : new Anthropic() }
    return cached.client
  }

  ipcMain.handle('chat:key:status', () => secrets.status(KEY_SETTING, 'ANTHROPIC_API_KEY'))
  ipcMain.handle('chat:key:set', (_e, key: string) => secrets.set(KEY_SETTING, key))
  ipcMain.handle('chat:key:clear', () => secrets.clear(KEY_SETTING))

  ipcMain.handle('tool:result', (_e, callId: string, reply: ToolReply) => { pendingTools.get(callId)?.(reply) })
  ipcMain.handle('chat:list', () => db.prepare('SELECT id, title, updated_at FROM chats ORDER BY updated_at DESC, rowid DESC LIMIT 100').all())
  ipcMain.handle('chat:get', (_e, id: string) => db.prepare('SELECT role, content FROM chat_messages WHERE chat_id = ? ORDER BY id').all(id))
  ipcMain.handle('chat:delete', (_e, id: string) => { db.prepare('DELETE FROM chats WHERE id = ?').run(id) })
  ipcMain.handle('chat:stop', (_e, requestId: string) => { inflight.get(requestId)?.abort() })

  ipcMain.handle('chat:send', (e, req: SendRequest) => {
    const wc = e.sender
    const emit = (ev: EventBody) => { if (!wc.isDestroyed()) wc.send('chat:event', { requestId: req.requestId, ...ev }) }

    if (!db.prepare('SELECT 1 FROM chats WHERE id = ?').get(req.chatId)) {
      db.prepare('INSERT INTO chats (id, title) VALUES (?, ?)').run(req.chatId, req.text.replace(/\s+/g, ' ').trim().slice(0, 60) || 'New chat')
    }
    db.prepare("INSERT INTO chat_messages (chat_id, role, content) VALUES (?, 'user', ?)").run(req.chatId, req.text)

    const rows = db.prepare('SELECT role, content FROM chat_messages WHERE chat_id = ? ORDER BY id').all(req.chatId) as { role: 'user' | 'assistant'; content: string }[]
    // Live app state rides on the newest user message only, so earlier turns stay byte-identical (cache-friendly).
    const nowSec = Math.floor(Date.now() / 1000)
    const ny = nyParts(nowSec)
    const context = {
      ...(req.context as object),
      clock: {
        nowUtc: new Date(nowSec * 1000).toISOString().slice(0, 16) + 'Z',
        newYork: `${ny.year}-${String(ny.month).padStart(2, '0')}-${String(ny.day).padStart(2, '0')} ${String(ny.hour).padStart(2, '0')}:${String(ny.minute).padStart(2, '0')}`,
        usMarketOpen: isMarketOpen(nowSec)
      }
    }
    const messages: Anthropic.Beta.BetaMessageParam[] = rows.map((r, i) => ({
      role: r.role,
      content: i === rows.length - 1 && r.role === 'user' ? `${r.content}\n\n<app_context>\n${JSON.stringify(context)}\n</app_context>` : r.content
    }))

    const abort = new AbortController()
    inflight.set(req.requestId, abort)
    const info = modelInfo(req.model)
    let text = ''

    void (async () => {
      const segments: string[] = []
      let inTokens = 0, outTokens = 0
      const saveText = () => {
        const all = [...segments, text].filter(Boolean).join('\n\n')
        if (all) db.prepare("INSERT INTO chat_messages (chat_id, role, content) VALUES (?, 'assistant', ?)").run(req.chatId, all)
      }
      try {
        // tools whose data the user's FMP plan does not include are left out, and Claude is told why
        const unavailable = readCaps(db)?.unavailable ?? []
        const ownTools = TOOL_PARAMS.filter((t) => !missingAll(unavailable, TOOL_CAPS[t.name] ?? []))
        let toolParams: unknown[] = ownTools
        if (mcp.has()) {
          try {
            const fmpTools = await mcp.tools()
            toolParams = fmpTools.length > MAX_UPFRONT_MCP_TOOLS
              ? [...ownTools, { type: 'tool_search_tool_bm25_20251119', name: 'tool_search_tool_bm25' }, ...fmpTools.map((t) => ({ ...t, defer_loading: true }))]
              : [...ownTools, ...fmpTools]
          } catch { /* FMP data tools are optional; the chart tools still work */ }
        }
        let final: Anthropic.Beta.BetaMessage
        for (let round = 0; ; round++) {
          text = ''
          const stream = getClient().beta.messages.stream(
            {
              model: info.id,
              max_tokens: 32000,
              system: SYSTEM_PROMPT + planNote(unavailable),
              messages,
              tools: toolParams as Anthropic.Beta.BetaToolUnion[],
              ...(info.reasoning ? { thinking: { type: 'adaptive' as const, display: 'summarized' as const }, output_config: { effort: req.effort } } : {}),
              ...(info.fallback ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {})
            },
            { signal: abort.signal }
          )
          for await (const ev of stream) {
            if (ev.type !== 'content_block_delta') continue
            if (ev.delta.type === 'text_delta') { text += ev.delta.text; emit({ type: 'text', text: ev.delta.text }) }
            else if (ev.delta.type === 'thinking_delta') emit({ type: 'thinking', text: ev.delta.thinking })
          }
          final = await stream.finalMessage()
          inTokens += final.usage.input_tokens
          outTokens += final.usage.output_tokens
          if (final.stop_reason !== 'tool_use') break
          if (round >= MAX_TOOL_ROUNDS) { emit({ type: 'text', text: '\n\n_(Stopped after too many tool calls.)_' }); text += '\n\n(Stopped after too many tool calls.)'; break }

          // Echo the assistant turn back unchanged (thinking blocks included), then answer every tool_use.
          segments.push(text)
          messages.push({ role: 'assistant', content: final.content })
          const results: Anthropic.Beta.BetaToolResultBlockParam[] = []
          for (const block of final.content) {
            if (block.type !== 'tool_use') continue
            emit({ type: 'tool_start', id: block.id, name: block.name, input: block.input })
            const r: ToolReply = mcp.owns(block.name) ? await mcp.call(block.name, block.input) : await callTool(wc, block.name, block.input, abort.signal)
            emit({ type: 'tool_end', id: block.id, ok: r.ok, result: r.text.slice(0, 4000) })
            const content: ToolContent = r.image
              ? [{ type: 'image', source: { type: 'base64', media_type: 'image/png', data: r.image } }, { type: 'text', text: r.text }]
              : r.text
            results.push({ type: 'tool_result', tool_use_id: block.id, content, ...(r.ok ? {} : { is_error: true }) })
          }
          messages.push({ role: 'user', content: results })
        }
        saveText()
        db.prepare('UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.chatId)
        emit({ type: 'done', model: final.model, stopReason: final.stop_reason, inputTokens: inTokens, outputTokens: outTokens })
      } catch (err) {
        if (err instanceof Anthropic.APIUserAbortError || abort.signal.aborted) {
          saveText()
          emit({ type: 'done', model: info.id, stopReason: 'stopped', inputTokens: 0, outputTokens: 0 })
        } else if (err instanceof Anthropic.AuthenticationError) {
          emit({ type: 'error', code: 'auth', message: 'The API key was rejected. Check it in File → Settings.' })
        } else if (err instanceof Anthropic.RateLimitError) {
          emit({ type: 'error', message: 'Rate limited. Wait a moment and try again.' })
        } else if (err instanceof Anthropic.APIError) {
          emit({ type: 'error', message: `API error ${err.status ?? ''}: ${err.message}` })
        } else {
          // no credentials at all surfaces as a plain Error from the SDK constructor/auth resolution
          const msg = err instanceof Error ? err.message : String(err)
          emit({ type: 'error', code: /api key|auth/i.test(msg) ? 'auth' : undefined, message: /api key|auth/i.test(msg) ? 'No API key found. Add one in File → Settings.' : msg })
        }
      } finally {
        inflight.delete(req.requestId)
      }
    })()
    return { ok: true }
  })
}
