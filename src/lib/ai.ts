import type { Insight } from '@/types'
import { generateId } from '@/lib/utils'

const EDGE_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`
  : null

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

function edgeHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (SUPABASE_ANON_KEY) {
    h['apikey'] = SUPABASE_ANON_KEY
    h['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`
  }
  return h
}

const MOCK_INSIGHTS: Insight[] = [
  {
    id: '1',
    emoji: '📊',
    title: 'Connect AI',
    body: 'Set your ANTHROPIC_API_KEY via the Supabase CLI to enable AI insights. Your PA will analyze your real data.',
    tag: 'tip',
    generatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    emoji: '✅',
    title: 'LYFE is set up',
    body: 'Your local-first life tracking is ready. Start logging entries to build up data for real insights.',
    tag: 'positive',
    generatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    emoji: '💡',
    title: 'Track consistently',
    body: 'The best insights come from at least 7 days of data. Aim to log at least 3 entries per day.',
    tag: 'tip',
    generatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    emoji: '🧠',
    title: 'Use all categories',
    body: 'The more categories you track, the more patterns your PA can identify across your life.',
    tag: 'tip',
    generatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    emoji: '🔥',
    title: 'Build streaks',
    body: 'Habit streaks compound over time. Even 5-minute habits logged daily create powerful patterns.',
    tag: 'positive',
    generatedAt: new Date().toISOString(),
  },
]

export async function generateInsights(dataContext: string): Promise<Insight[]> {
  if (!EDGE_URL) {
    await new Promise((r) => setTimeout(r, 800))
    return MOCK_INSIGHTS.map((i) => ({ ...i, id: generateId(), generatedAt: new Date().toISOString() }))
  }

  try {
    const res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: edgeHeaders(),
      body: JSON.stringify({ type: 'insights', data: dataContext }),
    })

    if (!res.ok) throw new Error(`AI request failed: ${res.status}`)

    const data = (await res.json()) as Insight[] | { insights?: Insight[] }
    return Array.isArray(data) ? data : (data.insights ?? [])
  } catch (err) {
    console.error('[AI] generateInsights error:', err)
    return MOCK_INSIGHTS.map((i) => ({ ...i, id: generateId(), generatedAt: new Date().toISOString() }))
  }
}

export async function streamChat(
  messages: { role: string; content: string }[],
  dataContext: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  if (!EDGE_URL) {
    const mock =
      "I'm your LYFE AI PA. Deploy the ai-chat Edge Function and set ANTHROPIC_API_KEY in Supabase secrets to enable real AI chat."
    for (const word of mock.split(' ')) {
      await new Promise((r) => setTimeout(r, 60))
      onChunk(word + ' ')
    }
    return
  }

  const res = await fetch(EDGE_URL, {
    method: 'POST',
    headers: edgeHeaders(),
    body: JSON.stringify({ type: 'chat', messages, data: dataContext }),
  })

  if (!res.ok) throw new Error(`Chat request failed: ${res.status}`)

  const reader = res.body?.getReader()
  const decoder = new TextDecoder()
  if (!reader) return

  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data: ')) continue
      const eventData = trimmed.slice(6)
      if (eventData === '[DONE]') return
      try {
        const parsed = JSON.parse(eventData)
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          onChunk(parsed.delta.text)
        }
      } catch {
        // skip malformed SSE lines
      }
    }
  }
}
