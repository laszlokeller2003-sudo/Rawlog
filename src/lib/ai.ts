import type { Insight } from '@/types'
import { generateId } from '@/lib/utils'

declare const process: any

const EDGE_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claude-proxy`
  : null

const MOCK_INSIGHTS: Insight[] = [
  {
    id: '1',
    emoji: '📊',
    title: 'Connect AI',
    body: 'Add your Supabase URL and ANTHROPIC_API_KEY to enable AI insights. Your PA will analyze your real data.',
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
  const apiKey =
    import.meta.env.VITE_ANTHROPIC_API_KEY ||
    (typeof process !== 'undefined' && process.env?.ANTHROPIC_API_KEY) ||
    ''

  // If Anthropic API Key is set, query Claude directly
  if (apiKey) {
    const prompt = `You are the LYFE AI PA, a brutal, data-driven personal assistant for life tracking.
Analyze the user's life tracking data and generate a list of 3 to 5 brutally honest, data-driven insights.
Focus on correlations, patterns, and areas of concern (e.g. substances, sleep quality, finance vs mood, etc.).
Be extremely direct and unfiltered.

Here is the user's life tracking data:
${dataContext}

Respond ONLY with a valid JSON array of Insight objects. Do not include markdown code block backticks (like \`\`\`json), do not include any conversational intro/outro. Just raw JSON.
Each Insight object must follow this TypeScript interface exactly:
interface Insight {
  id: string; // short unique ID
  emoji: string; // single emoji matching theme
  title: string; // action title (max 5 words)
  body: string; // brutally honest details (max 3 sentences)
  tag: 'positive' | 'warning' | 'tip' | 'pattern'; // category
  generatedAt: string; // ISO string
}`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          system: 'You are a JSON-only response generator. Output raw JSON arrays.',
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!res.ok) {
        throw new Error(`Anthropic API error: ${res.statusText}`)
      }

      const result = await res.json()
      const textContent = result.content?.[0]?.text || ''

      // Clean up potential backticks or text around JSON
      let jsonText = textContent.trim()
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7)
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3)
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3)
      }
      jsonText = jsonText.trim()

      const insights = JSON.parse(jsonText) as Insight[]
      return insights.map((insight) => ({
        ...insight,
        id: insight.id || generateId(),
        generatedAt: insight.generatedAt || new Date().toISOString(),
      }))
    } catch (err) {
      console.error('Error generating insights directly via Anthropic:', err)
      // Fallback to mock insights so UI doesn't break
      return MOCK_INSIGHTS.map((i) => ({ ...i, id: generateId(), generatedAt: new Date().toISOString() }))
    }
  }

  // Fallback to Supabase Edge Function if available
  if (EDGE_URL) {
    try {
      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'insights', data: dataContext }),
      })

      if (!res.ok) {
        throw new Error(`AI request failed: ${res.status}`)
      }

      const data = (await res.json()) as { insights?: Insight[] } | Insight[]
      return Array.isArray(data) ? data : data.insights ?? []
    } catch (err) {
      console.error('Error fetching insights via Edge Function:', err)
      return MOCK_INSIGHTS.map((i) => ({ ...i, id: generateId(), generatedAt: new Date().toISOString() }))
    }
  }

  // Fallback to Mock simulation
  await new Promise((r) => setTimeout(r, 1200))
  return MOCK_INSIGHTS.map((i) => ({ ...i, id: generateId(), generatedAt: new Date().toISOString() }))
}

export async function streamChat(
  messages: { role: string; content: string }[],
  dataContext: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  const apiKey =
    import.meta.env.VITE_ANTHROPIC_API_KEY ||
    (typeof process !== 'undefined' && process.env?.ANTHROPIC_API_KEY) ||
    ''

  // If Anthropic API Key is set, stream chat response directly
  if (apiKey) {
    const systemPrompt = `You are the LYFE AI PA, a brutal, data-driven personal assistant for life tracking.
Here is the user's life tracking data:
${dataContext}

Analyze this data and answer the user's questions honestly, directly, and without filters. Reference their real data whenever possible.
Be concise but thorough. Focus on patterns and give brutally honest feedback.`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
        stream: true,
      }),
    })

    if (!res.ok) {
      throw new Error(`Chat stream request failed: ${res.statusText}`)
    }

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    if (!reader) return

    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // Keep the last incomplete line in buffer

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
        } catch (e) {
          // Skip invalid JSON lines
        }
      }
    }
    return
  }

  // Fallback to Supabase Edge Function if available
  if (EDGE_URL) {
    const res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'chat', messages, data: dataContext }),
    })

    if (!res.ok) {
      throw new Error(`Chat request failed: ${res.status}`)
    }

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    if (!reader) return

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value, { stream: true })
      const lines = text.split('\n').filter((l) => l.startsWith('data: '))
      for (const line of lines) {
        const chunk = line.slice(6)
        if (chunk === '[DONE]') return
        onChunk(chunk)
      }
    }
    return
  }

  // Fallback to Mock simulation
  const mockResponse =
    "I'm your LYFE AI PA. Set up your Anthropic API key in environment variables to enable real AI chat. Once configured, I'll have access to all your life tracking data and can give you brutally honest, data-driven insights."
  for (const word of mockResponse.split(' ')) {
    await new Promise((r) => setTimeout(r, 60))
    onChunk(word + ' ')
  }
}
