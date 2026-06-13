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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { type, messages, data, prompt } = await req.json()

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
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

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          messages: [{ role: 'user', content: insightPrompt }],
        }),
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

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 3000,
          messages: [{ role: 'user', content: reportPrompt }],
        }),
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

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1500,
          system: systemWithData,
          stream: true,
          messages: messages.map((m: { role: string; content: string }) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        return new Response(JSON.stringify({ error: err }), {
          status: 502,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        })
      }

      // Stream through
      return new Response(res.body, {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown type' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
