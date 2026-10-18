import { describe, it, expect } from 'vitest'

interface SSEMessage {
  event: string
  data: string
}

function parseSSEBuffer(buffer: string): { messages: SSEMessage[]; remaining: string } {
  const messages: SSEMessage[] = []
  const parts = buffer.split('\n\n')
  const remaining = parts.pop() ?? ''

  for (const part of parts) {
    if (!part.trim()) continue
    let currentEvent = 'message'
    const dataLines: string[] = []

    for (const line of part.split('\n')) {
      if (line.startsWith('event:')) {
        currentEvent = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim())
      }
    }

    if (dataLines.length > 0) {
      messages.push({
        event: currentEvent,
        data: dataLines.join('\n'),
      })
    }
  }

  return { messages, remaining }
}

describe('SSE Stream Parsing with Split Chunks', () => {
  it('parses complete single SSE events', () => {
    const raw = 'event: status\ndata: {"step": "Analyzing winds"}\n\n'
    const { messages, remaining } = parseSSEBuffer(raw)

    expect(messages).toHaveLength(1)
    expect(messages[0].event).toBe('status')
    expect(JSON.parse(messages[0].data)).toEqual({ step: 'Analyzing winds' })
    expect(remaining).toBe('')
  })

  it('handles fragmented chunks arriving across network boundaries', () => {
    const chunk1 = 'event: token\ndata: {"token": "Safe'
    const chunk2 = ' conditions"}\n\nevent: done\ndata: {}\n\n'

    // First chunk is incomplete
    const res1 = parseSSEBuffer(chunk1)
    expect(res1.messages).toHaveLength(0)
    expect(res1.remaining).toBe(chunk1)

    // Second chunk appended to remainder
    const res2 = parseSSEBuffer(res1.remaining + chunk2)
    expect(res2.messages).toHaveLength(2)
    expect(res2.messages[0].event).toBe('token')
    expect(JSON.parse(res2.messages[0].data)).toEqual({ token: 'Safe conditions' })
    expect(res2.messages[1].event).toBe('done')
    expect(res2.remaining).toBe('')
  })

  it('correctly parses multiple stacked events in one buffer flush', () => {
    const raw = `event: status\ndata: {"step":"Weather"}\n\nevent: risk\ndata: {"level":"safe"}\n\nevent: done\ndata: {}\n\n`
    const { messages } = parseSSEBuffer(raw)

    expect(messages).toHaveLength(3)
    expect(messages.map((m) => m.event)).toEqual(['status', 'risk', 'done'])
  })
})
