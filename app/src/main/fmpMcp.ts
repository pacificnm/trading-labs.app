import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import type { Secrets } from './secrets'

const ENDPOINT = 'https://financialmodelingprep.com/mcp'
const PREFIX = 'fmp_'
const MAX_RESULT_CHARS = 12_000

export interface McpToolDef { name: string; description: string; input_schema: { type: 'object'; properties?: Record<string, unknown>; required?: string[] } }
export interface McpStatus { ok: boolean; count?: number; transport?: string; sample?: string[]; error?: string }

/**
 * Client-side connection to FMP's MCP server. The FMP key stays in this process (it only ever goes to FMP);
 * the server's tools are handed to Claude as ordinary tools and executed here.
 */
export function makeFmpMcp(secrets: Secrets) {
  let conn: { key: string; client: Client; transport: string; tools: McpToolDef[]; byName: Map<string, string> } | null = null
  let lastFailure: { key: string; at: number; error: string } | null = null

  const key = () => secrets.get('fmp_key') ?? process.env['FMP_API_KEY'] ?? null

  // Anthropic tool names allow [a-zA-Z0-9_-] up to 64 chars.
  const safeName = (n: string) => (PREFIX + n.replace(/[^a-zA-Z0-9_-]/g, '_')).slice(0, 64)

  async function connect(k: string) {
    const url = new URL(`${ENDPOINT}?apikey=${encodeURIComponent(k)}`)
    const attempts: { transport: string; make: () => StreamableHTTPClientTransport | SSEClientTransport }[] = [
      { transport: 'streamable-http', make: () => new StreamableHTTPClientTransport(url) },
      { transport: 'sse', make: () => new SSEClientTransport(new URL(`${ENDPOINT}/sse?apikey=${encodeURIComponent(k)}`)) }
    ]
    let lastErr: unknown
    for (const a of attempts) {
      const client = new Client({ name: 'trading-lab', version: '0.1.0' })
      try {
        await client.connect(a.make())
        const listed = await client.listTools()
        const byName = new Map<string, string>()
        const tools: McpToolDef[] = listed.tools.map((t) => {
          let name = safeName(t.name)
          for (let i = 2; byName.has(name); i++) name = safeName(t.name).slice(0, 60) + '_' + i
          byName.set(name, t.name)
          return {
            name,
            description: `[FMP] ${t.description ?? t.name}`,
            input_schema: { ...(t.inputSchema as object), type: 'object' } as McpToolDef['input_schema']
          }
        })
        return { key: k, client, transport: a.transport, tools, byName }
      } catch (e) {
        lastErr = e
        await client.close().catch(() => undefined)
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
  }

  async function ensure() {
    const k = key()
    if (!k) throw new Error('No FMP API key.')
    if (conn && conn.key === k) return conn
    if (conn) { await conn.client.close().catch(() => undefined); conn = null }
    // after a failure, don't hammer the server on every chat message
    if (lastFailure && lastFailure.key === k && Date.now() - lastFailure.at < 60_000) throw new Error(lastFailure.error)
    try { conn = await connect(k); lastFailure = null; return conn }
    catch (e) { lastFailure = { key: k, at: Date.now(), error: (e as Error).message }; throw e }
  }

  return {
    has: () => !!key(),
    async tools(): Promise<McpToolDef[]> { return (await ensure()).tools },
    owns: (name: string) => !!conn?.byName.has(name),
    async call(name: string, args: unknown): Promise<{ ok: boolean; text: string }> {
      const c = await ensure()
      const real = c.byName.get(name)
      if (!real) return { ok: false, text: `Unknown FMP tool ${name}.` }
      try {
        const res = await c.client.callTool({ name: real, arguments: (args ?? {}) as Record<string, unknown> })
        const parts = (res.content as { type: string; text?: string }[] | undefined) ?? []
        let text = parts.filter((p) => p.type === 'text').map((p) => p.text ?? '').join('\n')
        if (!text) text = res.structuredContent ? JSON.stringify(res.structuredContent) : '(no content)'
        if (text.length > MAX_RESULT_CHARS) text = text.slice(0, MAX_RESULT_CHARS) + `\n…[truncated: ${text.length - MAX_RESULT_CHARS} more characters. Ask for a narrower query (a specific symbol, period or limit).]`
        return { ok: !res.isError, text }
      } catch (e) {
        conn = null // force a reconnect next time
        return { ok: false, text: `FMP data request failed: ${(e as Error).message}` }
      }
    },
    async status(): Promise<McpStatus> {
      if (!key()) return { ok: false, error: 'No FMP API key.' }
      try {
        lastFailure = null
        const c = await ensure()
        return { ok: true, count: c.tools.length, transport: c.transport, sample: c.tools.slice(0, 12).map((t) => c.byName.get(t.name) ?? t.name) }
      } catch (e) { return { ok: false, error: (e as Error).message } }
    },
    async close() { await conn?.client.close().catch(() => undefined); conn = null }
  }
}
export type FmpMcp = ReturnType<typeof makeFmpMcp>
