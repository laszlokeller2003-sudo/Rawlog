// RAWLOG AI Edge Function — Deno / Supabase Edge
// Proxies requests to Anthropic Claude with server-side API key

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SYSTEM_PROMPT = `You are the RAWLOG AI PA — a brutal, data-driven personal assistant for life tracking.
You have access to the user's full life data: entries, habits, scores, goals.
Be direct, unfiltered, and data-driven. Never be vague. Call out patterns, correlations, and problem areas.
When giving insights, always reference specific numbers from the user's data.
Format responses in clear, scannable markdown when appropriate.`

// Distinguishable error codes returned to the frontend so the UI can react
// differently (e.g. "add billing" for rate limits vs "contact support" for
// missing_api_key) instead of always showing the same generic message.
type ErrorCode = 'missing_api_key' | 'invalid_api_key' | 'rate_limited' | 'overloaded' | 'anthropic_error' | 'network_error' | 'unknown'

class AnthropicCallError extends Error {
  code: ErrorCode
  status: number
  constructor(code: ErrorCode, status: number, message: string) {
    super(message)
    this.code = code
    this.status = status
  }
}

function errorTypeToCode(errorType: string | undefined, status: number): ErrorCode {
  if (status === 401 || status === 403) return 'invalid_api_key'
  if (status === 429 || errorType === 'rate_limit_error') return 'rate_limited'
  if (status === 529 || errorType === 'overloaded_error') return 'overloaded'
  return 'anthropic_error'
}

function jsonError(code: ErrorCode, message: string, status: number) {
  return new Response(JSON.stringify({ error: message, code }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

// Calls the Anthropic Messages API and returns the raw Response on success.
// On failure, logs the real status/type/message to the Edge Function logs
// and throws an AnthropicCallError carrying a code the frontend can branch on.
async function callAnthropic(body: unknown): Promise<Response> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const rawBody = await res.text()
    let errorType: string | undefined
    let errorMessage = rawBody
    try {
      const parsed = JSON.parse(rawBody)
      errorType = parsed?.error?.type
      errorMessage = parsed?.error?.message ?? rawBody
    } catch {
      // Anthropic returned a non-JSON error body — keep the raw text
    }

    console.error(
      `[ai-chat] Anthropic API error — status=${res.status} type=${errorType ?? 'unknown'} message=${errorMessage}`
    )

    throw new AnthropicCallError(errorTypeToCode(errorType, res.status), res.status, errorMessage)
  }

  return res
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { type, messages, data, prompt } = await req.json()

    if (!ANTHROPIC_API_KEY) {
      console.error('[ai-chat] ANTHROPIC_API_KEY is not set — configure it via `supabase secrets set`')
      return jsonError('missing_api_key', 'ANTHROPIC_API_KEY not configured', 500)
    }

    // ── Insights generation ──────────────────────────────────
    if (type === 'insights') {
      const insightPrompt = `${SYSTEM_PROMPT}

Here is the user's life tracking data:
${data}

Generate 4-6 brutally honest, data-driven insights about this person's life.
Respond ONLY with a valid JSON array. No markdown code blocks. Each object:
{
  "id": "unique-short-id",
  "emoji": "single emoji",
  "title": "max 5 word title",
  "body": "2-3 sentence brutally honest analysis",
  "tag": "positive|warning|tip|pattern",
  "generatedAt": "${new Date().toISOString()}"
}`

      const res = await callAnthropic({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{ role: 'user', content: insightPrompt }],
      })

      const result = await res.json()
      const text = result.content?.[0]?.text ?? '[]'
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

      return new Response(cleaned, {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // ── Auto-report generation ────────────────────────────────
    if (type === 'report') {
      const reportPrompt = `${SYSTEM_PROMPT}

Here is the user's life tracking data for the period:
${data}

${prompt || 'Generate a comprehensive daily life report covering: overall score, key highlights, areas of concern, patterns, and 3 actionable improvements for tomorrow.'}

Format the report in clean markdown with sections.`

      const res = await callAnthropic({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        messages: [{ role: 'user', content: reportPrompt }],
      })

      const result = await res.json()
      const text = result.content?.[0]?.text ?? ''

      return new Response(JSON.stringify({ report: text }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // ── Chat streaming ────────────────────────────────────────
    if (type === 'chat') {
      const systemWithData = `${SYSTEM_PROMPT}

CURRENT USER DATA:
${data}`

      const res = await callAnthropic({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        system: systemWithData,
        stream: true,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
      })

      // Stream through
      return new Response(res.body, {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      })
    }

    return jsonError('unknown', 'Unknown type', 400)
  } catch (err) {
    if (err instanceof AnthropicCallError) {
      return jsonError(err.code, err.message, err.status)
    }

    // Network failures (DNS, TLS, connection reset) surface as a plain
    // TypeError from fetch — distinguish them from unexpected bugs.
    const isNetworkError = err instanceof TypeError
    const message = err instanceof Error ? err.message : String(err)

    console.error(`[ai-chat] Unhandled error — ${isNetworkError ? 'network_error' : 'unknown'}:`, err)

    return jsonError(isNetworkError ? 'network_error' : 'unknown', message, isNetworkError ? 502 : 500)
  }
})
